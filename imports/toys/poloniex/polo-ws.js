/**
 * Created by kriz on 11/06/2017.
 */
import WebSocket from 'ws';
import util from 'util';
import { EventEmitter } from 'events';
import Fiber from 'fibers';

export const PoloWS = function () {
};
util.inherits(PoloWS, EventEmitter);
Object.assign(PoloWS.prototype, {
    _on: PoloWS.prototype.on,
    _removeListener: PoloWS.prototype.removeListener,

    open(callback) {
        PoloWS.super_.call(this);
        this._pairs = {};

        const ws = this.ws = new WebSocket('wss://api2.poloniex.com');
        this._onopenCb = callback;
        ws.onopen = e => this._onopen(e);
        ws.onclose = e => this._onclose(e);
        ws.onmessage = e => this._onmessage(e);

        this._msgs = [];
        this._fiber = new Fiber(() => this._msgFunc());
        this._fiber.run();
    },

    subscribe(channel) {
        if (channel === 'ticker')
            channel = 1002;

        if (this.ws.readyState === 1) {
            const params = { command: "subscribe", channel: channel };
            this.ws.send(JSON.stringify(params));
        } else
            console.error('WS socket is not ready');
    },

    on(channel, pair, callback) {
        if (typeof pair === 'function') {
            callback = pair;
            pair = 'ALL';
        }
        this._on(`${channel}_${pair}`, callback);
    },

    removeListener(channel, pair, callback) {
        if (typeof pair === 'function') {
            callback = pair;
            pair = 'ALL';
        }
        this._removeListener(`${channel}_${pair}`, callback);
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
        if ('error' in msg)
            return console.error('WS ERROR', msg.error);

        this._msgs.push(msg);
        if (this._waiting) {
            this._waiting = false;
            this._fiber.run();
        }
    },

    _msgFunc() {
        while (true) {
            const msg = this._msgs.shift();
            if (!msg) {
                this._waiting = true;
                Fiber.yield();
                continue;
            }

            let channel = msg[0];
            if (channel < 1000) {
                msg[2].forEach(data => this._onpair(channel, data));
            } else {
                switch (channel) {
                    case 1000: // user info
                    case 1001: // troll box
                    case 1010: // ping
                        break;
                    case 1002: // ticker events
                        if (msg[2]) // on this set to 1 no data
                            this._onTicker(msg[2]);
                        break;

                    default:
                        console.log('unknown channel', channel)
                }
            }
        }
    },

    _onclose(e) {
        this.open(this._onopenCb);
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
        const { currencyPair, orderBook } = data[1];
        this._pairs[pairId] = currencyPair;
        const eventPair = `order_${currencyPair}`;

        const propogate = (ob, type) => {
            _.each(ob, (amount, rate) => {
                amount = +amount;
                let order = {
                    currencyPair,
                    type,
                    rate,
                    amount
                };
                this.emit(eventPair, order);
                this.emit(`order_ALL`, order);
            })
        };
        propogate(orderBook[0], 'ask');
        propogate(orderBook[1], 'bid');
    },

    _onOrder(pairId, data) {
        const currencyPair = this._pairs[pairId];
        let eventPair = `order_${currencyPair}`;
        if (!this._events ||  (!this._events[eventPair] && !this._events[`order_ALL`]))
            return;

        const [cmd, bidAsk, rate, amount] = data;
        let order = {
            currencyPair,
            type: bidAsk ? 'bid' : 'ask',
            rate,
            amount: +amount,
        };
        this.emit(eventPair, order);
        this.emit('order_ALL', order);
    },

    _onTrade(pairId, data) {
        const currencyPair = this._pairs[pairId];
        let eventPair = `trade_${currencyPair}`;
        if (!this._events ||  (!this._events[eventPair] && !this._events[`trade_ALL`]))
            return;

        const [cmd, tradeID, buySell, rate, amount, date] = data;
        let trade = {
            currencyPair,
            type: buySell ? 'buy' : 'sell',
            tradeID: +tradeID,
            rate,
            amount: +amount,
            date,
            total: amount * rate,
        };
        this.emit(eventPair, trade);
        this.emit('trade_ALL', trade);
    },

    _onTicker: function (data) {
        const currencyPair = this._pairs[data[0]];
        if (!currencyPair)
            return;

        let pairEvent = `ticker_${currencyPair}`;
        if (!this._events ||  (!this._events[pairEvent] && !this._events[`ticker_ALL`]))
            return;

        const [cp, last, lowestAsk, highestBid, percentChange, baseVolume, quoteVolume, stopped, high24, low24] = data;
        const tick = {
            currencyPair,
            last, lowestAsk, highestBid, percentChange,
            quoteVolume, baseVolume,
            stopped,
            high24, low24
        };
        this.emit(pairEvent, tick);
        this.emit('ticker_ALL', tick);
    },

});
