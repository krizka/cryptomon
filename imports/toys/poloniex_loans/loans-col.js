/**
 * Created by kriz on 18/05/2017.
 */

export const PoloniexLoansCol = new Meteor.Collection('poloniex_loans');

export function findPoloniexLoansLast() {
    return PoloniexLoansCol.find({}, { sort: { createdAt: -1 }, limit: 1 });
}

export function findPoloniexLoansInterval(from, to) {
    return PoloniexLoansCol.find({
            $and: [
                { createdAt: { $gte: from } },
                { createdAt: { $lt: to } },
            ]
        },
        // { sort: { createdAt: 1 } }
    );
}

export function findPoloniexLoansAfter(date) {
    return PoloniexLoansCol.find(
        { createdAt: { $gte: date } },
        // { sort: { createdAt: 1 } }
    );
}
