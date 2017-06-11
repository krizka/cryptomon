/**
 * Created by kriz on 29/05/2017.
 */

import React from 'react';
import { composeWithTracker } from '../../../utils/komposer-utils';
import { PoloniexPushTickerCol } from '../ticker-col';


export const TickerComponent = React.createClass({
    render() {
        const { getTicker, currencyPair } = this.props;
        return (
            <div>
                <strong>Ticker for {currencyPair}</strong>
                <br/>
                <span>{getTicker(currencyPair)}</span>
            </div>
        );
    }
});

export function getSymbolTicker({ currencyPair }, onData) {
    const sub = Meteor.subscribe('poloniex.ticker', currencyPair);
    if (sub.ready()) {
        const ticker = PoloniexPushTickerCol.findOne(currencyPair);
        let getTicker = cp => {
            return ticker && ticker.last;
            // return (_.find(ticker, t => t._id === cp) || {}).last;
        };
        onData(null, { getTicker });
    }
}

export function getTicker(props, onData) {
    const sub = Meteor.subscribe('poloniex.ticker');
    if (sub.ready()) {
        let ticker = PoloniexPushTickerCol.find().fetch();
        let getTicker = cp => {
            return (_.find(ticker, t => t._id === cp) || {}).last;
        };

        onData(null, { getTicker });
    }
}
export const Ticker = composeWithTracker(getSymbolTicker)(TickerComponent);


// const TickerGraph = React.createClass({
//     render() {
//         const { ticker, currencyPair } = this.props;
//         retu
//     }
// });