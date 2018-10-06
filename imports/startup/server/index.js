import Config from '../../modules/config/server';

const ErrorHandler = Meteor.Error;

RavenLogger.initialize({
  server: Config.Raven.dsn
}, {
  release: process.env.COMMIT_HASH,
  autoBreadcrumbs: true
});

class RavenError extends Error {
  constructor(err, errorMessage, reason, details) {
    if (typeof err === 'string') {
      details = reason;
      reason = errorMessage;
      errorMessage = err;
      err = null;
    }
    // console.log("Throwing error", err, errorMessage, reason, details);
    // if(err) {
    //   RavenLogger.log(err, {
    //     errorMessage,
    //     reason,
    //     details
    //   });
    // } else {
    //   RavenLogger.log(errorMessage, reason, details);
    // }

    super(err, errorMessage, reason, details);
  }
}

// Meteor.Error = RavenError;

require("../../collections/networks/server/publications.js")
require("../../collections/hyperion/server/publications.js")
require("../../collections/files/server/publications.js")
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
