/**
 * Created by kriz on 25/05/2017.
 */

import _ from 'lodash';
import { tickerEmitter } from '../poloniex_ticker/pubs';
import { retry } from '../../utils/exceptions';

import request from '../../utils/request';
import { PoloWS } from '../poloniex/polo-ws';
import { getPublicApi } from '../poloniex/api';
// import { Alpha } from './ideas/alpha';
import { AVLTree } from 'dsjslib';


// global.AUTOBAHN_DEBUG = Meteor.isDevelopment;

// const polo = Meteor.settings.polo;

let orders = {};

export function getOrders() {
    return orders;
}

const trades = {};

export function getTrades(currencyPair, secsOld) {
    let tc = trades[currencyPair] || [];
    if (secsOld) {
        const lastTime = new Date().getTime() / 1000 - secsOld * 1000;
        const idx = _.findLastIndex(tc, t => t.date < lastTime);
        if (~idx)
            return tc.slice(idx, tc.length - idx);
        else
            return tc;
    } else
        return tc;
}

let conn;

function recalcPairs() {
    const [u_b, u_x, b_x] = WATCH.map(w => {
        const ord = orders[w];
        let bid = +_.max(Object.keys(ord.bid));
        let ask = +_.min(Object.keys(ord.ask));
        if (!bid || !ask)
            return;

        return { bid, ask, avg: (bid + ask) / 2 };
    });

    if (!u_b || !u_x || !b_x)
        return;

    const first = 1 * u_b.avg / u_x.avg * b_x.avg;
    const second = 1 / b_x.avg * u_x.avg / u_b.avg;

    const first1 = 1 * u_b.bid / u_x.ask * b_x.bid;
    const second1 = 1 / b_x.ask * u_x.bid / u_b.ask;

    const first2 = 1 * u_b.ask / u_x.bid * b_x.ask;
    const second2 = 1 / b_x.bid * u_x.ask / u_b.bid;

    // console.log(first, 'vs avg', second, ', ', first1, 'vs low', second1, ', ', first2, 'vs high', second2);
}

export const ticker = {};

export function getTicker(pair) {
    return ticker[pair];
}

function onTicker(args, kwargs, event) {
    const [currencyPair, last,
        lowestAsk, highestBid,
        percentChange, baseVolume, quoteVolume, isFrozen,
        high24hr, low24hr] = args;
    const t = ticker[currencyPair] || (ticker[currencyPair] = { accel: [] });

    const prevTime = t.lastTime || 0;
    const time = t.lastTime = Date.now();

    // let item = { time, accel };
    // t.accel.push(item);
    Object.assign(t, {
        currencyPair,
        last: +last,
        lowestAsk: +lowestAsk,
        highestBid: +highestBid,
        percentChange: +percentChange,
        baseVolume: +baseVolume,
        quoteVolume: +quoteVolume,
        high24hr: +high24hr, low24hr: +low24hr
    });

    tickerEmitter.emit(currencyPair, t);
    tickerEmitter.emit('any', t);

    // if (prevTime)
    //     console.log(currencyPair, item);
}

function onTicker2(tick) {
    tickerEmitter.emit('ticker', tick);
}

function onOrder(data) {
    const ordersPair = orders[data.currencyPair][data.type];
    const bestNum = orders[data.currencyPair].best;
    const best = bestNum[data.type];

    if (data.amount) {
        ordersPair.put(data.rate, data);

        if (data.type === 'bid') {
            bestNum[data.type] = ordersPair.max();
        } else {
            bestNum[data.type] = ordersPair.min();
        }
        // bestNum[data.type] = bestNum[data.type].toFixed(8);
        // recalcPairs();
    } else {
        ordersPair.delete(data.rate);

        if (data.type === 'bid' && data.rate >= best) {
            bestNum[data.type] = ordersPair.max();
        } else if (data.type === 'ask' && data.rate <= best) {
            bestNum[data.type] = ordersPair.min();
        }
    }
    tickerEmitter.emit('order', data);
}

function onTrade(data) {
    // trades[data.currencyPair].push(data);
    tickerEmitter.emit('trade', data);
}

function onPoloOpen() {
    orders = {};
}

// tickerEmitter.on('open', onPoloOpen)


function updateTicker() {
    const data = request(`https://poloniex.com/public?command=returnTicker`);
    t = JSON.parse(data.body);
    Object.assign(ticker, t);

}

export let poloEmitter;

let alpha;

export function runPolo() {
    if (conn)
        conn.close();

    // updateTicker();
    const api = getPublicApi();
    const activeCur = [];
    const volumes = retry(() => api.volume24());

    _.each(volumes, (vol, name) => {
        if (name.startsWith('BTC_'))
            activeCur.push(name);
    });


    const polo = poloEmitter = new PoloWS();
    polo.open(() => {
        console.log('WS opened');
        tickerEmitter.emit('open');
        activeCur.forEach(w => {
            polo.subscribe(w);
            orders[w] = { bid: new AVLTree(), ask: new AVLTree(), best: { bid: 0, ask: 99999 } };
            trades[w] = [];
        });
        polo.subscribe('ticker');

        let currencyPair = 'BTC_LTC';
        // new Fiber(() => {
        //     alpha = new Alpha({ currencyPair });
        //     polo.on('ticker', currencyPair, t => alpha.onTick(t));
        //     polo.on('trade', currencyPair, t => alpha.onTrade(t));
        // }).run();
        polo.on('ticker', onTicker2);
        polo.on('order', onOrder);
        polo.on('trade', onTrade);
        tickerEmitter.emit('connect', activeCur);
    });
    // console.log('connecting');
}

