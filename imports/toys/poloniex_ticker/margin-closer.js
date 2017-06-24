/**
 * Created by kriz on 29/05/2017.
 */

import { MarginOrder, ORDER_STATE } from '../poloniex_margin/order';
import { getPrivateApi } from '../poloniex/api';
import { retry } from '../../utils/exceptions';
import { tickerEmitter } from './pubs';
import _ from 'lodash';
import { diffDate } from '../../utils/date';
import { updateMarginPosition } from '../poloniex_margin/state-updater';
import { getOrders } from './push-ticker';
import Fiber from 'fibers';

function updateArray(col, cursor, array) {
    cursor.observeChanges({
        added(_id, fields) {
            array.push(col.findOne(_id));
        },
        changed(_id, fields) {
            const idx = array.findIndex(e => e._id === _id);
            array[idx] = col.findOne(_id);
        },
        removed(_id) {
            const idx = array.findIndex(e => e._id === _id);
            array.splice(idx, 1);
        },
    })
}

export function runMarginCloser() {
    tickerEmitter.on('ticker', closeStoppedOrders);

    const TAKE_GAP = 0.01; // 1%

    function closeStoppedOrders(ticker) {
        let currencyPair = ticker.currencyPair;

        const orders = MarginOrder.find({
            currencyPair,
            state: ORDER_STATE.CLOSED,
            stopLoss: { $exists: true },
            internal: true,
        }).fetch();

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            if (order.type === 'buy') {
                if (ticker.lowestAsk < order.stopLoss) { // make opposite closing order
                    const closeOrder = new MarginOrder({
                        type: 'sell',
                        rate: +ticker.lowestAsk,
                        simulation: order.simulation,
                        currencyPair,
                        amount: order.amount,
                        margin: order.margin,
                    });
                    closeOrder.makeOrder();
                    order.state = ORDER_STATE.TAKED;
                    order.save();
                } else {
                    const fixProfit = order.stopLoss < ticker.lowestAsk * (1 - TAKE_GAP);// 2%
                    if (fixProfit) {
                        order.stopLoss = ticker.lowestAsk * (1 - TAKE_GAP);
                        order.save();
                    }
                }
            } else if (order.type === 'sell') {
                if (ticker.highestBid > order.stopLoss) { // make opposite order
                    const closeOrder = new MarginOrder({
                        type: 'buy',
                        rate: +ticker.highestBid,
                        simulation: order.simulation,
                        currencyPair,
                        amount: order.amount,
                        margin: order.margin,
                    });
                    closeOrder.makeOrder();
                    order.state = ORDER_STATE.TAKED;
                    order.save();
                } else {
                    const fixProfit = order.stopLoss > ticker.highestBid * (1 + TAKE_GAP);// 2%
                    if (fixProfit) {
                        order.stopLoss = ticker.highestBid * (1 + TAKE_GAP);
                        order.save();
                    }
                }
            }
        }
    }
}

export const satoshi = 0.00000001;
const openRunners = [];
updateArray(MarginOrder, MarginOrder.find({ state: ORDER_STATE.PLACED, stay: { $ne: true } }), openRunners);

let movingOrders = false;

function moveOrder(order, newRate) {
    if (order.stopLoss)
        order.stopLoss = order.stopLoss / order.rate * newRate;
    order.rate = newRate;
    order.stay = movingOrders = true;
    order.save();
    const api = getPrivateApi(order.simulation);
    const result = retry(() => api.moveOrder(order.orderNumber, newRate), 2);
    if (result && result.success) {
        order.result = result;
        order.orderNumber = result.orderNumber;
        order.state = ORDER_STATE.PLACED;
    } else {
        order.state = ORDER_STATE.CANCELED;
    }
    order.stay = movingOrders = false;
    order.save();
    updateOpenOrders();
}

/// buy orders as maker only and move rate if its bad
export function runOrdersExecutor(order) {
    const orderRate = +order.rate;
    openRunners.forEach(o => {
        if (o.currencyPair !== order.currencyPair)
            return;

        const best = getOrders()[o.currencyPair].best;

        if (o.type === 'buy' && order.type === 'bid') {
            const newRate = +best.bid + 2 * satoshi;
            if (newRate !== o.rate) {
                try {
                    new Fiber(() => moveOrder(o, newRate)).run();
                } catch (e) {
                    console.log(e.message);
                }
            }
        } else if (o.type === 'sell' && order.type === 'ask') {
            const newRate = +best.ask - 2 * satoshi;
            if (newRate !== orderRate) {
                try {
                    new Fiber(() => moveOrder(o, newRate)).run();
                } catch (e) {
                    console.log(e.message);
                }
            }
        }
    });
}


tickerEmitter.on('order', runOrdersExecutor);


export function updateOpenOrders(currencyPair = 'all') {
    if (movingOrders)
        return;

    const api = getPrivateApi(false);

    const end = new Date();
    const start = diffDate(end, 0, 0, -1);
    // const tradeHistory = retry(() => api.tradeHistory(+start/1000, +end/1000, currencyPair));
    const openOrders = retry(() => api.openOrders(currencyPair));

    let query = { state: ORDER_STATE.PLACED };
    if (currencyPair !== 'all')
        query.currencyPair = currencyPair;
    const systemOrders = MarginOrder.find(query).fetch();

    const orders = [];
    _.each(openOrders, (os, currencyPair) => os.forEach(o => {
        o.currencyPair = currencyPair;
        orders.push(o);
    }));
    const closed = _.differenceBy(systemOrders, orders, 'orderNumber');
    closed.forEach(o => {
        MarginOrder.update(
            { orderNumber: o.orderNumber, state: ORDER_STATE.PLACED },
            { $set: { state: ORDER_STATE.TAKED } }, { multi: true });
        });

    const open = _.differenceBy(orders, systemOrders, 'orderNumber');
    open.forEach(o => {
        const stopLoss = o.rate * (1 + (o.type === 'buy' ? -0.007 : 0.007));

        const order = new MarginOrder({
            ...o,
            amount: +o.amount,
            rate: +o.rate,
            createdAt: new Date(o.date + ' UTC'),
            simulation: false,
            state: ORDER_STATE.PLACED,
            result: { success: 1, orderNumber: o.orderNumber },
            margin: !!o.margin,
            internal: false,
            // stopLoss,
        });
        order.save();

    });
}

export function updateOrdersOnTrade(trade) {
    const systemOrders = MarginOrder.find({
        ...(trade.type === 'buy' ?
            { rate: { $gte: +trade.rate }, type: 'buy' } :
            { rate: { $lte: +trade.rate }, type: 'sell' }),
        simulation: false,
        currencyPair: trade.currencyPair,
        state: ORDER_STATE.PLACED,
        internal: true,
    }).count();
    if (systemOrders)
        new Fiber(()=>updateOpenOrders()).run();
}

// tickerEmitter.on('trade', updateOrdersOnTrade);



let updateTimed = () => new Fiber(()=> {
    updateOpenOrders();
    Meteor.setTimeout(updateTimed, 10000);
}).run();
// updateTimed();

let updMarginPosition = () => new Fiber(() => {
    updateMarginPosition();
    Meteor.setTimeout(updMarginPosition, 5000);
}).run();
// updMarginPosition();

