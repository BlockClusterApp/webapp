const PrivateHiveServer = require('./server-communicator');
const debug = require('debug')('api:privatehive');

const PrivateHive = {};

PrivateHive.createPrivateHiveNetwork = async ({ details, userId }) => {
  const { id, domain, locationCode, kafkaDiskSpace, efsServer, ordererDiskSpace } = details;

  const organizations = [id];
  const domains = [domain];

  if (!(id && domain && id === domain && kafkaDiskSpace && efsServer && ordererDiskSpace && locationCode)) {
    throw new Meteor.Error('bad-request', 'Some fields are missing');
  }

  PrivateHiveServer.CreatePrivateHive(
    {
      id,
      domain,
      locationCode,
      kafkaDiskSpace,
      efsServer,
      ordererDiskSpace,
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

Meteor.methods({
  createPrivateHiveNetwork: PrivateHive.createPrivateHiveNetwork,
});

module.exports = PrivateHive;
