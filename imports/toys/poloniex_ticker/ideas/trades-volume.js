/**
 * Created by kriz on 14/06/2017.
 */

import { tickerEmitter } from '../pubs';
import { getPublicApi } from '../../poloniex/api';
import { retry } from '../../../utils/exceptions';
import sumBy from 'lodash/sumBy';
import minBy from 'lodash/minBy';
import maxBy from 'lodash/minBy';

// import talib from 'talib';

export const options = {
    notifyInterval: 5 * 60 * 1000,
    data: {},
};

export class TradesVolume {
    constructor(frameSecs) {
        this.trades = [];
        this.frame = frameSecs;
        this.volumeAmount = 0;
        this.volumeTotal = 0;
    }

    addTrade(trade) {
        if (this._exists(trade))
            return;

        this.trades.push(trade);

        this.volumeAmount += +trade.amount;
        this.volumeTotal += +trade.total;

        // remove old
        const lastTime = trade.date - this.frame;
        const idx = this.trades.findIndex(t => t.date >= lastTime);
        if (idx > 0) {
            const removed = this.trades.splice(0, idx);
            removed.forEach(t => this._removeTrade(t));
            // for (let i = 0; i < idx; i++) {
            //     this.removed(TRADES_COL_NAME, trades[i].time);
            // }
        }
    }

    _exists(trade) {
        // go backwards, searching for trade id, if iterated tradeID less than tradeID, then
        for (let i = this.trades.length - 1; i >= 0; i--) {
            const t = this.trades[i];
            if (t.tradeID === trade.tradeID)
                return true;
            if (t.tradeID < trade.tradeID)
                return false;
        }
        return false;
    }

    _removeTrade(trade) {
        this.volumeAmount -= +trade.amount;
        this.volumeTotal -= +trade.total;
    }

    avgPrice() {
        return this.volumeTotal / this.volumeAmount;
    }

    volumes(frame) {
        if (!this.trades.length)
            return [];

        const volumes = [];
        const start = Math.floor(this.trades[0].date / frame);
        this.trades.forEach(t => {
            let idx = Math.floor(t.date / frame) - start;
            volumes[idx] = (volumes[idx] || 0) + +t.total;
            while(idx > 0 && volumes[--idx] === undefined) volumes[idx] = 0;
        });
        return volumes;
    }

    volumeLast(frame) {
        if (!this.trades.length)
            return 0;

        let volume = 0;
        start = Date.now() / 1000;
        for (let i = this.trades.length - 1; i >= 0; i--) {
            const t = this.trades[i];
            if (t.date - start > frame)
                break;
            volume += +t.total;
        }
        return volume;
    }

    buySellPerc() {
        let buy = 0;
        let sell = 0;
        this.trades.forEach(t => {
            if (t.type === 'buy')
                buy += t.total;
            else
                sell += t.total;
        });
        return buy / (buy + sell);
    }

    candle(frame) {
        return {
            volume: this.volumeLast(frame)
        };
    }

    min() {
        if (!this.trades.length) return 0;
        return minBy(this.trades, t=>+t.rate).rate;
    }
    max() {
        if (!this.trades.length) return 0;
        return maxBy(this.trades, t=>+t.rate).rate;
    }
}

const signalWindow = 5;
const window = 60;
const framesPerDay = 24 * 60 * 60 / signalWindow;
let H1MSEC = 60 * 60 * 1000;
let startFactor = 10;

export function collectTrades(volumeMax) {
    function start(currencies) {
        currencies.forEach(currencyPair => {
            options.data[currencyPair] = {
                trades: new TradesVolume(window),
                limit: volumeMax,
                lastSignal: 0,
                currencyPair: currencyPair,
            };
        });

        // update 24h volumes once an hour
        let updateVolumes = () => {
            const api = getPublicApi();
            const volumes = retry(() => api.volume24());
            _.each(options.data, d => {
                d.volume24 = +volumes[d.currencyPair].BTC;
                d.volumePerMin = 2;//d.volume24 / framesPerDay;
                d.factor = startFactor;
            })
        };
        updateVolumes();
        Meteor.setInterval(updateVolumes, H1MSEC/* 1h */);

        tickerEmitter.on('trade', t => {
            let currencyPair = t.currencyPair;
            let currency = options.data[currencyPair];
            if (!currency)
                return;

            const trades = currency.trades;
            trades.addTrade(t);

            let timeDiff = Date.now() - currency.lastSignal;
            const factor = Math.max(startFactor, currency.factor * (1 - timeDiff / H1MSEC));
            let candle = trades.candle(signalWindow);
            if (candle.volume > (currency.volumePerMin * factor) && timeDiff > options.notifyInterval) {
                currency.factor = trades.volumeTotal / currency.volumePerMin * 1.5;
                let signal = {
                    currencyPair,
                    bs: trades.buySellPerc(),
                    volume: candle.volume,
                    volume24: currency.volume24,
                    factor: currency.factor,
                    min: trades.min(),
                    max: trades.max(),
                    rate: t.rate,
                    count: trades.trades.length,
                };
                tickerEmitter.emit('volumeSignal', signal);
                console.log(signal);
                currency.lastSignal = Date.now();
            }
        });
    }

    tickerEmitter.on('connect', Meteor.bindEnvironment(start));
}
