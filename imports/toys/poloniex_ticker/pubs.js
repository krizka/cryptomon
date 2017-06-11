/**
 * Created by kriz on 29/05/2017.
 */

import { EventEmitter }  from 'eventemitter';
import { getOrders, getTicker, ticker } from './push-ticker';
import { pushColName } from './ticker-col';


export const tickerEmitter = new EventEmitter;

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

Meteor.publish('poloniex.orders', function () {
    function makeId(value) {
        return `${value.currencyPair}_${value.rate.toFixed(8)}`;
    }

    const change = (value, exists) => {
        const id = makeId(value);
        if (exists)
            console.log('*', id) || this.changed(ORDERS_COL_NAME, id, value);
        else
            console.log('+', id) || this.added(ORDERS_COL_NAME, id, value);
    };
    const removed = value => {
        let id = makeId(value);
        console.log('-', id) || this.removed(ORDERS_COL_NAME, id);
    };

    const orders = getOrders();
    _.each(orders, pair => {
        _.each(pair, data => change(data, false));
    });

    tickerEmitter.on('order', change);
    tickerEmitter.on('orderRemove', removed);
    this.onStop(() => {
        tickerEmitter.removeListener('order', change);
        tickerEmitter.removeListener('orderRemove', removed);

    });

    this.ready();

});

let TRADES_COL_NAME = 'poloniex_trades';

Meteor.publish('poloniex.trades', function () {
    const trade = data => {
        const id = data.time;
        this.added(TRADES_COL_NAME, id, value);
    };
    this.onStop(() => {
        tickerEmitter.removeListener('trade', trade);
    });
    tickerEmitter.on('trade', trade);

    // const orders = getTrades();
    // _.each(orders, (type, data) => {
    //     _.each(data, rate =>
    //         this.added(TRADES_COL_NAME, `${type}_${rate}`, data)
    //     )
    // });
    this.ready();

});