/**
 * Created by kriz on 18/05/2017.
 */

import {
    findPoloniexOrdersAfter, findPoloniexOrdersInterval, findPoloniexOrdersLast,
} from './orders-col';

Meteor.publish('poloniex_orders/last', function () {
    return findPoloniexOrdersLast();
});

Meteor.publish('poloniex_orders', function (from, to) {
    return findPoloniexOrdersInterval(from, to);
});

Meteor.publish('poloniex_orders/after', function (date) {
    return findPoloniexOrdersAfter(date);
});

Meteor.methods({
    'poloniex_orders/interval'(from, to) {
        return findPoloniexOrdersInterval(from, to).fetch();
    }
});