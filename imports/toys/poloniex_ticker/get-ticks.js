/**
 * Created by kriz on 18/05/2017.
 */
import requestNode from 'request';
import _ from 'lodash';

import { PoloniexTickerCol } from './ticker-col';

const request = Meteor.wrapAsync(requestNode);

export function updateTicks() {
    // PoloniexLoansCol

    const createdAt = new Date;
    const data = request(`https://poloniex.com/public?command=returnTicker`);
    const ticker = JSON.parse(data.body);


    PoloniexTickerCol.insert({
        createdAt,
        ticker,
    });
}
