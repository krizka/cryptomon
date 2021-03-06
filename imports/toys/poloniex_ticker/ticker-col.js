/**
 * Created by kriz on 18/05/2017.
 */

export const PoloniexTickerCol = new Meteor.Collection('poloniex_ticker');

Object.assign(PoloniexTickerCol, {
    findLast() {
        return PoloniexTickerCol.find({}, { sort: { createdAt: -1 }, limit: 1 });
    },

    findInterval(from, to) {
        return PoloniexTickerCol.find({
                $and: [
                    { createdAt: { $gte: from } },
                    { createdAt: { $lt: to } },
                ]
            },
            // { sort: { createdAt: 1 } }
        );
    },

    findAfter(date) {
        return PoloniexTickerCol.find(
            { createdAt: { $gte: date } },
            // { sort: { createdAt: 1 } }
        );
    },
});

export const pushColName = 'poloniex_push_ticker';
export const PoloniexPushTickerCol = new Meteor.Collection(pushColName);

export const PoloniexTrades = new Meteor.Collection('poloniex_trades');
export const PoloniexOrders = new Meteor.Collection('poloniex_orders_book');
