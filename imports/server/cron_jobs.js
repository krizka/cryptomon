/**
 * Created by kriz on 18/12/16.
 */
import { SyncedCron } from 'meteor/percolate:synced-cron';
import { updateLoans } from '../toys/poloniex_loans/get-loans';

export default function () {
    SyncedCron.add({
        name: 'update poloniex loans',
        schedule(parser) {
            if (Meteor.isProduction)
                return parser.cron('*/5 * * * *');
            else
                return parser.cron('*/1 * * * *');
        },
        job: updateLoans
    });

    SyncedCron.start();
}