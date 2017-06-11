/**
 * Created by kriz on 25/05/2017.
 */

import autobahn from 'autobahn';
import _ from 'lodash';
import { tickerEmitter } from '../poloniex_ticker/pubs';
import request from '/imports/utils/request';
import { MARGIN_PAIRS } from '/imports/crypto/currencies';
import WebSocket from 'ws';
import util from 'util';
import { EventEmitter } from 'events';


global.AUTOBAHN_DEBUG = Meteor.isDevelopment;

const polo = Meteor.settings.polo;

function makeWatch(cur) {
    return [
        'USDT_BTC',
        `USDT_${cur}`,
        `BTC_${cur}`,
    ];
}

// const WATCH = makeWatch('XRP');


const orders = {};
export function getOrders() {
    return orders;
}

MARGIN_PAIRS.forEach(w => orders[w] = {});

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
function onOrderTrade(args, kwargs, event) {
    if (!args.length)
        return;

    args.forEach(arg => {
        let pair = event.topic;
        const ordersPair = orders[pair];
        let data = arg.data;
        data.rate = +data.rate;
        data.currencyPair = pair;
        switch (arg.type) {
            case'orderBookModify':
                data.amount = +(data.amount);
                const exists = !!ordersPair[data.rate];
                ordersPair[data.rate] = data;
                // recalcPairs();
                tickerEmitter.emit('order', data, exists);
                return;
            case 'orderBookRemove':
                const old = ordersPair[data.rate];
                delete ordersPair[data.rate];
                if (old)
                    tickerEmitter.emit('orderRemove', old);
                return;
            case 'newTrade':
                data.amount = +data.amount;
                data.total = parseFloat(data.total);
                data.date = new Date(data.date + ' UTC');
                tickerEmitter.emit('trade', data);
                return;
        }
    });
}

function updateTicker() {
    const data = request(`https://poloniex.com/public?command=returnTicker`);
    t = JSON.parse(data.body);
    Object.assign(ticker, t);

}

function webSockets_subscribe(channel, conn, usid) {
    if (conn.readyState == 1) {
        var params = { command: "subscribe", channel: channel };
        if (channel == 1000)
            params['userID'] = usid;
        conn.send(JSON.stringify(params));
    }
}


const PoloWS  = function () {
};
util.inherits(PoloWS, EventEmitter);
Object.assign(PoloWS.prototype, {
    open(callback) {
        this._pairs = {};

        const ws = this.ws = new WebSocket('wss://api2.poloniex.com');
        this._onopenCb = callback;
        ws.onopen = e => this._onopen(e);
        ws.onclose = e => this._onclose(e);
        ws.onmessage = e => this._onmessage(e);
    },

    subscribe(channel, callback) {
        if (channel === 'ticker')
            channel = 1002;

        if (callback)
            this.on(channel, callback);

        if (this.ws.readyState === 1) {
            const params = { command: "subscribe", channel: channel };
            this.ws.send(JSON.stringify(params));
        } else
            console.error('WS socket is not ready');
    },

    _onopen(e) {
        this._onopenCb(this);
        // webSockets_subscribe(1000, e.target, 10432006); // my own
        // webSockets_subscribe(1001, e.target); // trollbox
        // this.subscribe(1002, e.target); // ticker events
        // ['BTC_BTS'].forEach(w => this.subscribe(w));
    },

    _onmessage(e) {
        const msg = JSON.parse(e.data);
        let channel = msg[0];
        if ('error' in msg)
            console.error('WS ERROR', msg.error);

        if (channel < 1000)
            msg[2].forEach(data => this._onpair(channel, data));
        else {
            switch (channel) {
                case 1000: // user info
                case 1001: // troll box
                case 1010: // ping
                    break;
                case 1002: // ticker events
                    break;

                default:
                    console.log('unknown channel', channel)
            }
        }
    },

    _onclose(e) {
        console.log('WS CLOSE', e);
    },

    _onpair(pairId, data) {
        let cmd = data[0];
        switch (cmd) {
            case 'i':
                this._onInfo(pairId, data);
                break;
            case 'o':
                this._onOrder(pairId, data);
                break;
            case 't':
                this._onTrade(pairId, data);
                break;
        }
    },

    _onInfo(pairId, data) {
        const {currencyPair, orderBook} = data[1];
        this._pairs[pairId] = currencyPair;

        const propogate = (ob, type) => {
            _.each(ob, (amount, rate) => {
                amount = +amount;
                this.emit('order', {
                    currencyPair,
                    type,
                    rate,
                    amount
                });
            })
        };
        propogate(orderBook[0], 'ask');
        propogate(orderBook[1], 'bid');
    },

    _onOrder(pairId, data) {
        const currencyPair = this._pairs[pairId];
        const [cmd, bidAsk, rate, amount] = data;
        let obj = {
            currencyPair,
            type: bidAsk ? 'ask' : 'bid',
            rate: +rate,
            amount: +amount,
        };
        this.emit('order', obj);
    },

    _onTrade(pairId, data) {
        const currencyPair = this._pairs[pairId];
        const [cmd, tradeId, buySell, rate, amount, time] = data;
        this.emit('trade', {
            currencyPair,
            type: buySell ? 'sell' : 'buy',
            tradeId,
            rate: +rate,
            amount: +amount,
            time: new Date(time * 1000)
        });
    }
});

export function runPolo() {
    if (conn)
        conn.close();

    // updateTicker();

    const polo = new PoloWS();
    polo.open(() => {
        ['BTC_BTS'].forEach(w => polo.subscribe(w));
    });

    conn = new autobahn.Connection({ url: 'wss://api.poloniex.com', realm: 'realm1' });

    conn.onopen = function (session) {
        console.log('open');

        // 1) subscribe to a topic

        ['BTC_BTS'].forEach(w =>
            session.subscribe(w, onOrderTrade));
        // MARGIN_PAIRS.forEach(w =>
        //     session.subscribe(w, onOrderTrade));
        session.subscribe('ticker', onTicker);


        // 2) publish an event
        // session.publish('com.myapp.hello', ['Hello, world!']);

        // 3) register a procedure for remoting
        // function add2(args) {
        //     return args[0] + args[1];
        // }
        // session.register('com.myapp.add2', add2);

        // 4) call a remote procedure
        // session.call('com.myapp.add2', [2, 3]).then(
        //     function (res) {
        //         console.log("Result:", res);
        //     }
        // );
    };

    conn.onclose = (reason, event) => {
        conn = null;
        console.log('closed', reason);
        if (!event.will_retry)
            runPolo();
    };

    // connection.onerror =
    //     err => console.error(err);

    console.log('connecting');
    // conn.open();
}
