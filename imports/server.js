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
import './toys/poloniex_loans';



Meteor.startup(() => {
    initMigrations();
    cronJobs();
});
