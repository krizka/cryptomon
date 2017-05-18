/**
 * Created by kriz on 18/05/2017.
 */

import {
    findPoloniexLoansAfter, findPoloniexLoansInterval, findPoloniexLoansLast,
} from './loans-col';

Meteor.publish('poloniex_loans/last', function () {
    return findPoloniexLoansLast();
});

Meteor.publish('poloniex_loans', function (from, to) {
    return findPoloniexLoansInterval(from, to);
});

Meteor.publish('poloniex_loans/after', function (date) {
    return findPoloniexLoansAfter(date);
});

Meteor.methods({
    'poloniex_loans/interval'(from, to) {
        return findPoloniexLoansInterval(from, to).fetch();
    }
});