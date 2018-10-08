import Config from '../../modules/config/server';
import fs from 'fs';

const ErrorHandler = Meteor.Error;

RavenLogger.initialize({
  server: Config.Raven.dsn
}, {
  release: process.env.COMMIT_HASH,
  autoBreadcrumbs: true
});

if(!fs.existsSync(`/tmp/logs`)) {
  fs.mkdirSync(`/tmp/logs`);
}

ElasticLogger.initialize({
  logFiles: [
    {
      filename: `/tmp/logs/webapp-logs.log`
    }
  ]
}, {
  tags: {
    release: process.env.COMMIT_HASH,
    env: process.env.NODE_ENV
  }
});


// Meteor.Error = RavenError;

require("../../collections/networks/server/publications.js")
require('../../collections/user-invitation/server/publications.js');
require("../../collections/utilities/server/publications.js")
require("../../collections/payments/server/publications.js")
require("../../api/platform")
require("../../collections/users/server/publications");
require("../../collections/vouchers/server/publications");
require('../../collections/support-ticket/server/publications');
require('../../api/payments');
require('../../api/billing');

require('../../modules/schedulers');

export {}
