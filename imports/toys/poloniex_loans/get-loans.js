/**
 * Created by kriz on 18/05/2017.
 */
import requestNode from 'request';
import _ from 'lodash';

import { PoloniexLoansCol } from './loans-col';
import { CURRENCIES } from '../../crypto/currencies';



const request = Meteor.wrapAsync(requestNode);

function clearLoans(loans) {
    const offers = loans.offers.map(o => ({
        rangeMin: o.rangeMin,
        rangeMax: o.rangeMax,
        rate: parseFloat(o.rate),
        amount: parseFloat(o.amount),
    }));

    return {
        offers: {
            // all: offers,
            count: offers.length,
            avg: _.sumBy(offers, o => o.rate) / offers.length,
            total: _.sumBy(offers, o => o.amount),
            min: _.minBy(offers, o => o.rate),
            max: _.maxBy(offers, o => o.rate),

        }
    };
}

export function updateLoans() {
    // PoloniexLoansCol

    const cur = {};
    CURRENCIES.forEach(currency => {
        const data = request(`https://poloniex.com/public?command=returnLoanOrders&currency=${currency}&limit=999999`);
        cur[currency] = clearLoans(JSON.parse(data.body));
    });

    PoloniexLoansCol.insert({
        createdAt: new Date,
        cur,
    });
}
