const PrivateHiveServer = require('./server-communicator');
const debug = require('debug')('api:privatehive');

const PrivateHive = {};

/* Add functions in this namespace so that it can be directly called when giving privatehive API endpoints for API access */
PrivateHive.createPrivateHiveNetwork = async ({ details, userId }) => {
  const { id, domain, locationCode, kafkaDiskSpace, efsServer, ordererDiskSpace } = details;

  const organizations = [id];
  const domains = [domain];

  if (!(id && domain && id === domain && kafkaDiskSpace && efsServer && ordererDiskSpace && locationCode)) {
    throw new Meteor.Error('bad-request', 'Some fields are missing');
  }

  /* This invokes the CreatePrivateHive method in the privatehive server. No HTTP calls or endpoints to look for. Same function names to be used here and that server */
  PrivateHiveServer.CreatePrivateHive(
    {
      id,
      domain,
      locationCode,
      kafkaDiskSpace,
      efsServer,
      ordererDiskSpace,
      organizations,
      domains,
    },
    (err, response) => {
      if (err) {
        throw new Meteor.Error('bad-request', err);
      }
      debug('Response from privatehive server', response);
      return true;
    }
  );
};

/* Meteor methods so that our frontend can call these function without using HTTP calls. Although I would prefer to use HTTP instead of meteor method. */
Meteor.methods({
  createPrivateHiveNetwork: PrivateHive.createPrivateHiveNetwork,
});

module.exports = PrivateHive;
