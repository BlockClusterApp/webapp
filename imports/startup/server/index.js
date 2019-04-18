import Config from '../../modules/config/server';
import fs from 'fs';
import morgan from 'morgan';
import path from 'path';
import Bluebird from 'bluebird';

const fetchRedis = require('../../modules/helpers/server/redis');
const fsAsync = Bluebird.promisifyAll(fs);

const uuid = require('uuid/v4');

function loadLuaScripts(_redisClient) {
  function loadScripts(dir) {
    dir = path.join(dir, '..');
    return fsAsync
      .readdirAsync(dir)
      .filter(file => path.extname(file) === '.lua')
      .map(file => {
        const longName = path.basename(file, '.lua');
        const name = longName.split('-')[0];
        const numberOfKeys = Number(longName.split('-')[1]);
        return fsAsync.readFileAsync(path.join(dir, file)).then(lua => ({
          name,
          options: { numberOfKeys, lua: lua.toString() },
        }));
      });
  }
  const scripts = loadScripts(Assets.absoluteFilePath('redis-lua/isOperationAllowed-2.lua'));
  return scripts.each(command => !console.log(`Loading redis function ${command.name}`) && _redisClient.defineCommand(command.name, command.options));
}
(async () => {
  const redis = await fetchRedis();
  loadLuaScripts(redis);
})();

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
    if (logObject && ['/ping', '/api/config-client'].includes(logObject.url)) {
      return undefined;
    }
    // if (process.env.NODE_ENV === 'development') {
    //   return undefined;
    // }
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
require('../../collections/locations/server/publications');
require('../../api/payments');
require('../../api/billing');

require('../../modules/schedulers');

export {};
