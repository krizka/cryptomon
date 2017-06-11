/**
 * Created by kriz on 18/05/2017.
 */

import React from 'react';
import { compose, withProps } from 'recompose';
import {
    findPoloniexLoansAfter, findPoloniexLoansInterval, findPoloniexLoansLast,
    PoloniexLoansCol
} from '../loans-col';
import { TradingViewGraph } from '../../../ui/utils/TradingView';
import { CURRENCIES } from '/imports/crypto/currencies';


export const LoansGraph = ({ datafeed, symbol, loans }) => {
    // const byCurrency = loans.loans;
    return (<TradingViewGraph datafeed={datafeed} symbol={symbol}/>);
};

function getLastLoans(props, onData) {
    const sub = Meteor.subscribe('poloniex_loans/last');
    if (sub.ready()) {
        const loans = findPoloniexLoansLast().fetch()[0];
        onData(null, {
            loans
        });
    }
}

const symbols = {};

CURRENCIES.forEach(c => {
    symbols[c] = {
        name: c,
        ticker: c,
        description: c,
        type: 'bitcoin',
        session: '24x7',
        exchange: 'poloniex',
        // listed_exchange: 'poloniex',
        timezone: 'UTC',
        pricescale: 0.0001,
        minmov: 0.00000001,
        fractional: false,
        has_intraday: true,
    }
});

const loanToBar = (symbolInfo, l) => {
    const offers = l.cur[symbolInfo.ticker].offers;

    let min = offers.min ? offers.min.rate : 0; // XXX save null rate in DB
    return {
        time: l.createdAt.getTime(),
        open: min,//offers.avg,
        close: min,
        low: min,
        high: min,
        volume: offers.total
    }
};


function reduceBars(start, bars, resolution) {
    const res = resolution*60*1000;

    return _.reduce(bars, (result, bar) => {
        const last = _.last(result);
        if (!last || (bar.time - last.time > res)) {
            result.push({ ...bar });
        } else {
            Object.assign(last, {
                close: bar.close,
                low: Math.min(last.low, bar.low),
                high: Math.max(last.high, bar.high),
                volume: last.volume + bar.volume
            });
        }
        return result;
    }, start);
}
function setDatafeed(props) {
    const datafeed = {
        onReady(config) {
            setTimeout(() => config({
                exchanges: [{ value: 'poloniex', name: 'Poloniex', desc: 'Poloniex Exchange' }],
                supported_types: CURRENCIES.map(c => ({ name: c, value: c })),
                supported_resolutions: [5, 15, 30, 60, 240, 720, "D"],
                supports_marks: false,
                supports_timescale_marks: false,
                supports_time: false,
            }), 0);
        },

        resolveSymbol(symbol, resolve, error) {
            if (~symbol.indexOf(':'))
                symbol = symbol.split(':')[1];

            if (symbols[symbol])
                setTimeout(() => resolve(symbols[symbol]), 0);
            else
                error(`unknown symbol ${symbol}`);
        },

        getBars(symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) {
            Meteor.call('poloniex_loans/interval', new Date(from * 1000), new Date(to * 1000), (error, loans) => {
                if (error)
                    return onErrorCallback(error.message);

                if (firstDataRequest)
                    delete this.bars;
                // XXX simplify
                this.bars = (this.bars || []).concat(loans.map(l => loanToBar(symbolInfo, l)));
                this.reduced = reduceBars([], this.bars, +resolution);
                let noData = !loans.length;
                onHistoryCallback(noData ? [] : this.reduced, { noData });
            });
        },

        subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
            this.subs = this.subs || {};

            let date = new Date();
            const self = this;
            const observe = findPoloniexLoansAfter(date).observeChanges({
                added(id, doc) {
                    self.reduced = reduceBars(self.reduced, [loanToBar(symbolInfo, doc)], +resolution);
                    const last = _.last(self.reduced);
                    onRealtimeCallback(last);
                }
            });

            this.subs[subscriberUID] = {
                sub: Meteor.subscribe('poloniex_loans/after', date),
                observe,
            };
        },

        unsubscribeBars(subscriberUID) {
            const subs = this.subs[subscriberUID];
            if (subs) {
                subs.sub.stop();
                subs.observe.stop();
                delete this.subs[subscriberUID];
            }
        },

        stop() {
            _.each(this.subs, s => {
                s.sub.stop();
                s.observe.stop();
            });
            this.subs = {};
        }
    };

    return { datafeed };
}


export const LoansGraphWithData = compose(
    withProps(setDatafeed)
    // composeWithTracker(getLastLoans)
)(LoansGraph);