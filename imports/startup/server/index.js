import Config from '../../modules/config/server';

const ErrorHandler = Meteor.Error;

RavenLogger.initialize({
  server: Config.Raven.dsn
}, {
  release: process.env.COMMIT_HASH,
  autoBreadcrumbs: true
});

ElasticLogger.initialize({
  logFiles: [
    {
      filename: '/logs/webapp-logs.log'
    }
  ]
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
