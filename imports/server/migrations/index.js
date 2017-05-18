/**
 * Created by kriz on 13/01/16.
 */

import { Migrations } from 'meteor/percolate:migrations';

// import './001_add_user_code';

export default function () {
    // see https://github.com/percolatestudio/meteor-migrations for details
    Migrations.config({
        // Log job run details to console
        log: true,
        // Use a custom logger function (defaults to Meteor's logging package)
        logger: null,
        // Enable/disable logging "Not migrating, already at version {number}"
        logIfLatest: true,
        // migrations collection name to use in the database
        collectionName: 'migrations'
    });

    Migrations.migrateTo('latest');
}
