/**
 * Created by kriz on 18/05/2017.
 */
// import {
//     findPoloniexLoansAfter, findPoloniexLoansInterval, findPoloniexLoansLast,
// } from './loans-col';
import { MARGIN_ORDER_TYPE, MarginOrder, MarginPosition, ORDER_STATE } from './order';
import { getTicker } from '../poloniex_ticker/push-ticker';
import { tickerEmitter } from '../poloniex_ticker/pubs';
import { getPrivateApi, poloniexPrivateApi } from '../poloniex/api';
import { updateOpenOrders, updateOrdersOnTrade } from '../poloniex_ticker/margin-closer';
import { retry } from '../../utils/exceptions';
import { updateMarginPosition } from './state-updater';

MarginOrder.extend({
    helpers: {
        makeOrder() {
            const api = getPrivateApi(this.simulation);
            const ORDER_METHODS = {
                true: { // margin
                    [MARGIN_ORDER_TYPE.BUY]: api.marginBuy,
                    [MARGIN_ORDER_TYPE.SELL]: api.marginSell,
                },
                false: { // margin
                    [MARGIN_ORDER_TYPE.BUY]: api.buy,
                    [MARGIN_ORDER_TYPE.SELL]: api.sell,
                }
            };

            // const lendingRate = 0.005;

            try {

                let apiMethod = ORDER_METHODS[this.margin][this.type];
                if (!apiMethod)
                    throw new Error('unknow order type');

                const result = this.result = retry(() => apiMethod.call(api, this.currencyPair, this.rate, this.amount, {
                    // lendingRate,
                }), 3);

                if (this.margin)
                    this.state = result.orderNumber ? ORDER_STATE.PLACED : ORDER_STATE.ERROR;
                else
                    this.state = ORDER_STATE.PLACED;
                this.orderNumber = result.orderNumber;
                // order.closer = closer;

                this.save();

                // try {
                //     updateOpenOrders();
                // } catch (e) {
                //     console.error('openOrders', e);
                // }

                return this.result;

            } catch (err) {
                throw new Meteor.Error(err.message);
            }
        },

        moveOrder(newRate) {
            if (this.stopLoss)
                this.stopLoss = this.stopLoss / this.rate * newRate;
            this.rate = newRate;
            this.save();
            const api = getPrivateApi(this.simulation);
            const result = retry(() => api.moveOrder(this.orderNumber, newRate), 5);
            if (result && result.success) {
                this.result = result;
                this.orderNumber = result.orderNumber;
                this.state = ORDER_STATE.PLACED;
            } else {
                this.state = ORDER_STATE.CANCELED;
            }
            this.save();
        },

    }
});

Meteor.methods({
    'margin.order'(orderForm) {
        // check(orderForm, MarginOrderForm);

        // const lastTicker = getTicker(orderForm.currencyPair);
        // if (!lastTicker)
        //     throw new Meteor.Error('ticker not yet ready');

        const order = new MarginOrder(orderForm);
        order.makeOrder();
        order.save();
    },

    'margin.cancel'(orderId) {
        const order = MarginOrder.findOne(orderId);
        if (!order)
            throw new Meteor.Error('order not found');

        const api = getPrivateApi(order.simulation);
        const result = retry(() => api.cancelOrder(order.result.orderNumber));
        order.state = ORDER_STATE.CANCELED;
        order.save();
    },

    'margin.move'(orderId, newRate) {
        const order = MarginOrder.findOne(orderId);
        if (!order)
            throw new Meteor.Error('order not found');
        newRate = +newRate;

        if (order.stopLoss)
            order.stopLoss = order.stopLoss / order.rate * newRate;
        order.rate = newRate;
        const api = getPrivateApi(order.simulation);
        const result = retry(() => api.moveOrder(order.orderNumber, newRate));
        if (result.success) {
            order.result = result;
            order.orderNumber = result.orderNumber;
            order.save();
        }
    },

    'margin.changeOrder'(orderId, data) {
        const order = MarginOrder.findOne(orderId);
        if (!order)
            throw new Meteor.Error('order not found');

        const lastTicker = getTicker(order.currencyPair);
        const rate = order.orderType === 'buy'
            ? lastTicker.lowestAsk * (1 - data.rateGap / 100)
            : lastTicker.highestBid * (1 + data.rateGap / 100);

        if (rate !== order.rate) {
            const api = poloniexPrivateApi(apiKey, apiSecret);
            const result = api.moveOrder(order.orderNumber, rate);
            if (result.success) {
                order.rate = rate;
                order.rateGap = data.rateGap;
                order.save();
            }
        }
        console.log(data);
    },

    'margin.closePosition'(currencyPair) {
        const api = getPrivateApi(false);
        const result = retry(() => api.closeMarginPosition({ currencyPair }));
        if (result.success) {
            MarginOrder.update(
                { state: ORDER_STATE.CLOSED, margin: true, currencyPair },
                { $set: { state: ORDER_STATE.TAKED } }, { multi: true });
        }
        updateMarginPosition();
        return result;
    },

    'margin.reverseOrder'(orderId, rate) {
        const order = MarginOrder.findOne(orderId);
        if (!order)
            throw new Meteor.Error('order not found');

        rate = +rate;
        const { result, state, orderNumber, stopLoss, ...data } = order;
        const reversed = new MarginOrder(data);
        reversed.rate = rate;
        reversed.type = order.type === 'buy' ? 'sell' : 'buy';
        reversed.makeOrder();

        order.state = ORDER_STATE.TAKED;
        order.save();
    },

    'poloniex.margin.updateOrders'() {
        updateOpenOrders();
    },
});

Meteor.publish('poloniex.margin.open', function () {
    return MarginOrder.find({ state: ORDER_STATE.PLACED });
});

Meteor.publish('poloniex.margin.orders', function (currencyPair) {
    return MarginOrder.find({ currencyPair });
});

Meteor.publish('poloniex.margin.closed', function () {
    return MarginOrder.find({ state: { $ne: ORDER_STATE.PLACED } });
});

Meteor.publish('poloniex.margin.position', function () {
    return MarginPosition.find();
});