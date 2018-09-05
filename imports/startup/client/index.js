global.Buffer = global.Buffer || require('buffer/').Buffer; //Polyfill for Node.js Buffer

import Config from '../../modules/config/client';

RavenLogger.initialize({
  client: Config.Raven.dsn
}, {
  trackUser: true,
  release: process.env.COMMIT_HASH
});
