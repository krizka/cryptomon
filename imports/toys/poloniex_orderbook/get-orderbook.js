/**
 * Created by kriz on 18/05/2017.
 */
import requestNode from 'request';
import _ from 'lodash';

import { PoloniexOrdersCol } from './orders-col';
import { CURRENCIES } from '../../crypto/currencies';



const request = Meteor.wrapAsync(requestNode);

function btc([price, am]) {
    return +am * price;
}

function orig([price, am]) {
    return +am;
}

const price = ([price]) => +price;

function summOrders(orders) {
    const asks50 = orders.asks.slice(0, 50);
    const bids50 = orders.bids.slice(0, 50);

    const bidsBTC = _.sumBy(orders.bids, a => btc(a));
    const asksBTC = _.sumBy(orders.asks, a => btc(a));

    let bidsPerc, asksPerc;
    if (bidsBTC > asksBTC) {
        let sum = 0;
        const includeBids = orders.bids.findIndex(a => {
            sum += btc(a);
            if (sum >= asksBTC)
                return true;
        });
        bidsPerc = price(orders.bids[0]) / price(orders.bids[includeBids]);
        asksPerc = price(_.last(orders.asks)) / price(orders.asks[0]);
    } else {
        let sum = 0;
        const includeAsks = orders.asks.findIndex(a => {
            sum += btc(a);
            if (sum >= bidsBTC)
                return true;
        });
        bidsPerc = price(orders.bids[0]) / price(_.last(orders.bids));
        asksPerc = price(orders.asks[includeAsks]) / price(orders.asks[0]);
    }

    return {
        bids: _.sumBy(bids50, b => orig(b)),
        bidsBTC: _.sumBy(bids50, b => btc(b)),
        asks: _.sumBy(asks50, a => orig(a)),
        asksBTC: _.sumBy(asks50, a => btc(a)),
        asksPerc,
        bidsPerc,
    };

}

export function updateOrderBook() {
    const orders = {};
    const data = request(`https://poloniex.com/public?command=returnOrderBook&depth=200&currencyPair=all`);
    const ordersData = JSON.parse(data.body);
    if (ordersData.error)
        throw new Error(ordersData.error);

    CURRENCIES.forEach(currency => {
        if (currency === 'BTC')
            return;

        let cur = `BTC_${currency}`;
        orders[cur] = summOrders(ordersData[cur]);
    });

    PoloniexOrdersCol.insert({
        createdAt: new Date,
        orders,
        data: ordersData,
    });
}
