/**
 * Created by kriz on 18/05/2017.
 */

import { CURRENCIES, MARGIN_PAIRS } from '../../crypto/currencies';
import { tickerEmitter } from './pubs';
import { diffDate } from '../../utils/date';
import { PoloniexTrades } from './ticker-col';


const MIN = 60;
const intervals = [5, 15, 30, 1*MIN, 5*MIN, 15*MIN, 60*MIN, 4*MIN*MIN, 12*MIN*MIN, 24*MIN*MIN];

Meteor.publish('poloniex.trades_table', function (currencies = MARGIN_PAIRS) {
    const trades = {};

    const newTrade = (last) => {
        const { currencyPair } = last;
        const d = last.date;
        const trade = {};

        PoloniexTrades.insert(last);

        intervals.forEach(i => {
            const d = diffDate(d, 0, 0, 0, 0, -i, 0);
            let found = PoloniexTrades.findOne(
                { currencyPair, createdAt: { $gte: d } },
                { sort: { createdAt: 1 } });
            trade[i] = found && found.rate;
        });
        const before = trades[last.currencyPair];
        trades[last.currencyPair] = trade;

        if (before)
            this.changed(currencyPair, { trade });
        else
            this.added(currencyPair, { trade });
    };

    tickerEmitter.on('newTrade', newTrade);

    this.ready();
});
