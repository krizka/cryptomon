/**
 * Created by kriz on 18/12/16.
 */
import { SyncedCron } from 'meteor/percolate:synced-cron';
import { updateLoans } from '../toys/poloniex_loans/get-loans';
import { updateTicks } from '../toys/poloniex_ticker/get-ticks';
import { updateOrderBook } from '../toys/poloniex_orderbook/get-orderbook';

export default function () {
    // SyncedCron.add({
    //     name: 'update poloniex loans',
    //     schedule(parser) {
    //         if (Meteor.isProduction)
    //             return parser.cron('*/5 * * * *');
    //         else
    //             return parser.cron('*/1 * * * *');
    //     },
    //     job: updateLoans
    // });

    // SyncedCron.add({
    //     name: 'update poloniex orderbook',
    //     schedule(parser) {
    //         if (Meteor.isProduction)
    //             return parser.cron('*/5 * * * *');
    //         else
    //             return parser.cron('*/1 * * * *');
    //     },
    //     job: updateOrderBook
    // });
    //
    // SyncedCron.add({
    //     name: 'update poloniex ticker',
    //     schedule(parser) {
    //         return parser.cron('*/1 * * * *');
    //     },
    //     job: updateTicks
    // });

    SyncedCron.start();
}