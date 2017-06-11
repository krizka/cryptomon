/**
 * Created by kriz on 05/11/16.
 */

// import './routes';
import initMigrations from './server/migrations';

import './utils';
// import { restoreI18n } from  './i18n/server';
import './server/methods';
import './server/methods';

import './server/fixtures';
import cronJobs from './server/cron_jobs';
import Fiber from 'fibers';
import './toys';
import './toys/poloniex_loans';
import './toys/poloniex_orderbook';
import startup  from './server/startup';




Meteor.startup(() => {
    initMigrations();
    cronJobs();
    startup();
});
