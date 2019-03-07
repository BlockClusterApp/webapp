import PrivateHive from '../../collections/privatehive';
import Bluebird from 'bluebird';

const NetworkOperations = {};

NetworkOperations.addOrgToChannel = async ({ channelName, organizationId, newOrgEndpoint }) => {
  let newOrgId;
  if (newOrgEndpoint.includes('.ph.blockcluster.io')) {
    newOrgId = newOrgEndpoint
      .replace('.ph.blockcluster.io', '')
      .replace('https://', '')
      .replace('http://', '');
  }

  if (!newOrgId) {
    ElasticLogger.log('New org id does not exists', { channelName, organizationId, newOrgEndpoint });
    // TODO: Need to handle this
  }

  const newOrgNetwork = PrivateHive.find({ instanceId: `ph-${newOrgId}` }).fetch()[0];
  const requestingOrg = PrivateHive.find({ instanceId: organizationId }).fetch()[0];

  if (!newOrgNetwork) {
    throw new Meteor.Error(403, 'Org not in blockcluster');
  }

  let ordererOrg = PrivateHive.find({ _id: requestingOrg.ordererId }).fetch()[0];

  if (!ordererOrg) {
    ordererOrg = requestingOrg;
  }

  if (!ordererOrg) {
    throw new Meteor.Error(403, 'Orderer network not found');
  }

  const otherNetworks = PrivateHive.find({ ordererId: newOrgNetwork.ordererId, _id: { $ne: newOrgNetwork._id } }).fetch();

  let requestVoteEndPoints = [{ url: ordererOrg.properties.apiEndPoint, token: ordererOrg.properties.tokens && ordererOrg.properties.tokens[0] }];
  otherNetworks.forEach(network => {
    if (network && network.status === 'running' && network.properties && network.properties.apiEndPoint) {
      requestVoteEndPoints.push({ url: network.properties.apiEndPoint, token: network.properties.tokens && network.properties.tokens[0] });
    }
  });

  console.log('Sending vote request to ', { requestVoteEndPoints, channelName, organizationId });

  await Bluebird.map(
    [{ url: ordererOrg.properties.apiEndPoint, token: ordererOrg.properties.tokens && ordererOrg.properties.tokens[0] }], // requestVoteEndPoints,
    Meteor.bindEnvironment(endPoint => {
      return new Promise(
        Meteor.bindEnvironment((resolve, reject) => {
          HTTP.call(
            'POST',
            `https://${endPoint.url}/voting/request`,
            {
              headers: {
                'x-access-key': endPoint.token,
              },
              data: {
                channelName,
                initiatorOrg: requestingOrg.instanceId.replace('ph-', ''),
                ordererOrg: ordererOrg.instanceId.replace('ph-', ''),
                ordererAPIClientHost: ordererOrg.properties.apiEndPoint,
                allPeers: requestVoteEndPoints,
                newOrg: newOrgId,
                ordererOrgHost: ordererOrg.properties.externalOrderers[0].split(':')[0],
                newOrgEndPoint: newOrgNetwork.properties.apiEndPoint,
              },
            },
            (err, res) => {
              console.log('Channel vote request', err, res);
              return resolve(res);
            }
          );
        })
      );
    })
  );

  return true;
};

Meteor.methods({
  addOrgToChannel: NetworkOperations.addOrgToChannel,
});

module.exports = NetworkOperations;
