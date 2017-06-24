import initMigrations from '/imports/base/server/migrations';
import { runPolo } from '/imports/base/toys/poloniex_ticker/push-ticker';
import '/imports/base/toys/poloniex_orderbook/get-orderbook';


Meteor.startup(() => {
    initMigrations();
    runPolo();
});