/**
 * Created by kriz on 18/05/2017.
 */
import requestNode from 'request';
import _ from 'lodash';

import { PoloniexOrdersCol } from './orders-col';
import { CURRENCIES } from '../../crypto/currencies';
import { getOrders } from '../poloniex_ticker/push-ticker';
import '../../utils/extend-binary-tree';


const request = Meteor.wrapAsync(requestNode);

function btc([price, am]) {
    return +am * price;
}

function orig([price, am]) {
    return +am;
}

const price = ([price]) => +price;

function summOrders(orders) {
    // const asks50 = orders.asks.slice(0, 50);
    // const bids50 = orders.bids.slice(0, 50);

    const sum_bids = (bids, perc) => {
        const start = bids.maxNode();
        if (!start)
            return 0;
        let node = start, sum = 0;
        const maxPrice = +start.key * (1 - perc);
        while(node && node.key >= maxPrice) {
            sum += +node.key * node.value.amount;
            node = bids.predecessorNode(node)
        }
        return sum;
    };
    const sum_asks = (asks, perc) => {
        const start = asks.minNode();
        if (!start)
            return 0;
        let node = start, sum = 0;
        const minPrice = +start.key * (1 + perc);
        while(node && +node.key <= minPrice) {
            sum += +node.key * node.value.amount;
            node = asks.successorNode(node)
        }
        return sum;
    };

    const res = { bid: [], ask: [] };

    [0.0015, 0.003, 0.05, 0.01, 0.02].forEach(p => {
        res.bid.push(sum_bids(orders.bid, p));
        res.ask.push(sum_asks(orders.ask, p));
    });
    return res;
}

const ordersData = getOrders();

export function updateOrderBook() {
    // const orders = {};
    // const data = request(`https://poloniex.com/public?command=returnOrderBook&depth=200&currencyPair=all`);
    // const ordersData = JSON.parse(data.body);
    // if (ordersData.error)
    //     throw new Error(ordersData.error);

    CURRENCIES.forEach(currency => {
        if (currency === 'BTC')
            return;

        let cur = `BTC_${currency}`;
        let ordersDatum = ordersData[cur];
        if (ordersDatum) {
            const orders = summOrders(ordersDatum);

            PoloniexOrdersCol.insert({
                createdAt: new Date,
                currencyPair: cur,
                orders,
            });
        }

    });

}


function startUpdateOrderBook() {
    Meteor.setTimeout(startUpdateOrderBook, 5000);
    updateOrderBook();
    // let now = Date.now();
    // const sleep = now - Math.floor(now / 5000) * 5000; // tick at round 5 seconds
}
startUpdateOrderBook();
