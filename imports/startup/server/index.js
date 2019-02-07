import Config from '../../modules/config/server';
import fs from 'fs';
import morgan from 'morgan';
const uuid = require('uuid/v4');

const ErrorHandler = Meteor.Error;

RavenLogger.initialize(
  {
    server: Config.Raven.dsn,
  },
  {
    release: process.env.COMMIT_HASH,
    autoBreadcrumbs: true,
  }
);

if (!fs.existsSync(`/tmp/logs`)) {
  fs.mkdirSync(`/tmp/logs`);
}

ElasticLogger.initialize(
  {
    logFiles: [
      {
        filename: `/tmp/logs/webapp-logs.log`,
      },
    ],
  },
  {
    tags: {
      release: process.env.COMMIT_HASH,
      env: process.env.NODE_ENV,
    },
  }
);

JsonRoutes.Middleware.use(
  morgan((tokens, req, res) => {
    const logObject = {
      requestId: uuid(),
      clientIP: req.headers['x-forwarded-for'],
      origin: req.headers.origin,
      host: req.headers.host,
      referer: req.headers.referer,
      accessToken: req.headers.authorization || req.query.token,
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      responseLength: tokens.res(req, res, 'content-length'),
      responseTime: tokens['response-time'](req, res),
      timestamp: new Date(),
      cfRay: req.headers['cf-ray'],
      contentLength: req.headers['content-length'],
    };

    if (req && req.headers) {
      const headers = req.headers;
      delete headers['x-forwarded-for'];
      delete headers.origin;
      delete headers.referer;
      delete headers['content-length'];
      delete headers.cookies;
      delete headers.cookie;
      delete headers['cache-control'];
      delete headers.authorization;
      delete headers[':authority'];
      delete headers[':method'];
      delete headers[':path'];
      delete headers.host;
      logObject.headers = headers;
    }

    // Disable logging Kube pings
    if (logObject && logObject.url === '/ping') {
      return undefined;
    }
    if (process.env.NODE_ENV === 'development') {
      return undefined;
    }
    ElasticLogger.log('ApiRequest', logObject);

    return undefined;
  })
);

// Meteor.Error = RavenError;

require('../../collections/networks/server/publications.js');
require('../../collections/hyperion/server/publications.js');
require('../../collections/files/server/publications.js');
require('../../collections/user-invitation/server/publications.js');
require('../../collections/utilities/server/publications.js');
require('../../collections/payments/server/publications.js');
require('../../collections/wallets/server/publications.js');
require('../../api/platform');
require('../../collections/users/server/publications');
require('../../collections/vouchers/server/publications');
require('../../collections/support-ticket/server/publications');
require('../../collections/network-configuration/server/publications');
require('../../collections/api-keys/server/publications');
require('../../collections/webhooks/server/publications');
require('../../collections/paymeter/server/publications');
require('../../collections/pricing/server/publications');
require('../../collections/privatehive/server/publications');
require('../../api/payments');
require('../../api/billing');

require('../../modules/schedulers');

export {};
