/**
 * Created by kriz on 29/05/2017.
 */

import { EventEmitter }  from 'eventemitter';
import { getOrders, getTicker, getTrades, ticker } from './push-ticker';
import { pushColName } from './ticker-col';
import { check } from 'meteor/check';

export const tickerEmitter = new EventEmitter;
tickerEmitter.subscribe = function (event, cb) {
    this.on(event, cb);
    return () => this.removeListener(event, cb);
};

Meteor.publish('poloniex.ticker', function (currencyPair = 'any') {
    const update = (value) => {
        this.changed(pushColName, value.currencyPair, value);
    };

    this.onStop(() => tickerEmitter.removeListener(currencyPair, update));
    tickerEmitter.on(currencyPair, update);

    if (currencyPair === 'any') {
        _.forEach(ticker, (ticker, currencyPair) => this.added(pushColName, currencyPair, ticker));
    } else {
        const ticker = getTicker(currencyPair);
        if (ticker)
            this.added(pushColName, currencyPair, ticker);
    }
    this.ready();
});

let ORDERS_COL_NAME = 'poloniex_orders_book';

Meteor.publish('poloniex.orders', function (currencyPair) {
    const self = this;
    this.sent = function(id) {
        const col = self._session.collectionViews[ORDERS_COL_NAME];
        // let col = this._documents[ORDERS_COL_NAME];
        return col && col.documents[id];
    };


    function makeId(value) {
        return `${value.currencyPair}_${value.rate}_${value.type}`;
    }

    function filterOut(value) {
        const best = getOrders()[value.currencyPair].best[value.type];
        if (value.type === 'bid') {
            return value.rate < best * 0.99;
        } else {
            return value.rate > best * 1.01;
        }
    }

    const change = (value) => {
        if (value.currencyPair !== currencyPair)
            return;

        const id = makeId(value);
        const sent = this.sent(id);

        if (value.amount) {
            if (sent)
                this.changed(ORDERS_COL_NAME, id, value);
            else {
                if (!filterOut(value))
                    this.added(ORDERS_COL_NAME, id, value);
            }
        } else if (sent) {
            this.removed(ORDERS_COL_NAME, id);
        }
    };

    const orders = getOrders()[currencyPair];

    if (!orders)
        return this.ready();

    _.each(orders.bid, data => change(data));
    _.each(orders.ask, data => change(data));

    tickerEmitter.on('order', change);
    this.onStop(() => {
        tickerEmitter.removeListener('order', change);
    });

    this.ready();
});

let TRADES_COL_NAME = 'poloniex_trades';

Meteor.publish('poloniex.trades', function (currencyPair, timeSec) {
    const trades = [];

    const sendTrade = data => {
        if (data.currencyPair !== currencyPair)
            return;

        const id = data.date;
        this.added(TRADES_COL_NAME, id, data);
        trades.push(data);
        // remove old
        const lastTime = data.date - timeSec * 1000;
        const idx = trades.findIndex(t => t.date >= lastTime);
        if (idx > 0) {
            for (let i = 0; i < idx; i++) {
                this.removed(TRADES_COL_NAME, trades[i].time);
            }
            trades.splice(0, idx);
        }
    };

    getTrades(currencyPair, timeSec).forEach(sendTrade);

    this.onStop(() => {
        tickerEmitter.removeListener('trade', sendTrade);
    });
    tickerEmitter.on('trade', sendTrade);

    this.ready();
});


const POLONIEX_INFO_COL = 'poloniex_info';
Meteor.publish('poloniex.currencyInfo', function (currencyPair) {
    check(currencyPair, String);

    const id = `info_${currencyPair}`;
    const updateInfo = (info, first) => {
        if (first)
            this.added(POLONIEX_INFO_COL, id, info);
        else
            this.changed(POLONIEX_INFO_COL, id, info)
    };

    const stop = tickerEmitter.subscribe(id, updateInfo);
    this.onStop(stop);
});
