/**
 * Created by kriz on 18/05/2017.
 */

export const PoloniexOrdersCol = new Meteor.Collection('poloniex_orders');

export function findPoloniexOrdersLast() {
    return PoloniexOrdersCol.find({}, { sort: { craeatedAt: -1 }, limit: 1 });
}

export function findPoloniexOrdersInterval(from, to) {
    return PoloniexOrdersCol.find({
            $and: [
                { createdAt: { $gte: from } },
                { createdAt: { $lt: to } },
            ]
        },
        { fields: { data: 0 } }
    );
}

export function findPoloniexOrdersAfter(date) {
    return PoloniexOrdersCol.find(
        { createdAt: { $gte: date } },
        { fields: { data: 0 } }
    );
}
