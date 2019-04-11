import fs from 'fs';
import request from 'request-promise';

import Config from '../../modules/config/server';
import { PrivatehivePeers } from '../../collections/privatehivePeers/privatehivePeers.js';

const Operations = {};

function uploadFile(fileName, content) {
  return new Promise((resolve, reject) => {
    const filePath = `/tmp/${fileName}`;
    fs.writeFile(filePath, content, { encoding: 'binary' }, err => {
      if (err) {
        return reject(err);
      }
      resolve(filePath);
    });
  });
}

Operations.fetchChannels = async ({ networkId }) => {
  if (!networkId) {
    throw new Meteor.Error(400, 'Network ID required');
  }
  const userId = Meteor.userId();

  const network = PrivatehivePeers.findOne({
    instanceId: networkId,
    userId,
  });

  if (!network) {
    throw new Meteor.Error(403, 'Invalid network');
  }

  const res = request({
    uri: `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/channels/list`,
    method: 'GET',
    json: true,
  });

  return res;
};

Operations.addChaincode = async ({ file, content, name, type, networkId }) => {
  if (!networkId) {
    throw new Meteor.Error(400, 'Network ID required');
  }
  const userId = Meteor.userId();

  const network = PrivatehivePeers.findOne({
    instanceId: networkId,
    userId,
  });

  if (!network) {
    throw new Meteor.Error(403, 'Invalid network');
  }

  let filePath;
  try {
    filePath = await uploadFile(`${userId}-${network.name.replace(/\s/g, '_')}-${name}`, content);
  } catch (err) {
    throw new Meteor.Error(err);
  }

  const url = `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/chaincodes/add`;
  const chaincodeRequest = request.post(url);
  const form = chaincodeRequest.form();

  form.append('chaincode_zip', fs.createReadStream(filePath));
  form.append('chaincodeName', name);
  form.append('chaincodeLanguage', type);

  const res = await chaincodeRequest;

  if (res.error) {
    throw new Meteor.Error(res.message);
  }

  return true;
};

Operations.fetchChaincodes = async ({ networkId }) => {
  if (!networkId) {
    throw new Meteor.Error(400, 'Network ID required');
  }
  const userId = Meteor.userId();

  const network = PrivatehivePeers.findOne({
    instanceId: networkId,
    userId,
  });

  if (!network) {
    throw new Meteor.Error(403, 'Invalid network');
  }

  const res = await request.get(`http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/chaincodes/list`, { json: true });

  if (res.error) {
    throw new Meteor.Error(400, res.message);
  }

  return res;
};

Operations.installChaincode = async ({ name, type, version, networkId }) => {
  if (!networkId) {
    throw new Meteor.Error(400, 'Network ID required');
  }
  const userId = Meteor.userId();

  const network = PrivatehivePeers.findOne({
    instanceId: networkId,
    userId,
  });

  if (!network) {
    throw new Meteor.Error(403, 'Invalid network');
  }

  let res = await request({
    uri: `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/chaincodes/install`,
    method: 'POST',
    body: {
      chaincodeName: name,
    },
    json: true,
  });

  if (res.error) {
    throw new Meteor.Error(400, res.message);
  }

  return res;
};

Operations.instantiateChaincode = async ({ name, channelName, functionName, args, endorsmentPolicy, networkId }) => {
  if (!networkId) {
    throw new Meteor.Error(400, 'Network ID required');
  }
  const userId = Meteor.userId();

  const network = PrivatehivePeers.findOne({
    instanceId: networkId,
    userId,
  });

  if (!network) {
    throw new Meteor.Error(403, 'Invalid network');
  }

  const res = await request({
    uri: `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/chaincodes/instantiate`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      chaincodeName: name,
      channelName,
      functionName,
      args,
      endorsmentPolicy,
    },
    json: true,
  });

  if (res.error) {
    throw new Meteor.Error(400, res.message);
  }
  return res;
};

Operations.addNotificationURL = async ({ networkId, notificationURL, chaincodeName, channelName, chaincodeEventName, startBlock }) => {
  if (!networkId) {
    throw new Meteor.Error(400, 'Network ID required');
  }
  const network = PrivatehivePeers.findOne({
    instanceId: networkId,
    userId: Meteor.userId(),
  });

  if (!network) {
    throw new Meteor.Error(403, 'Invalid network');
  }

  const url = `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/notifications/add`;

  const res = await request({
    uri: url,
    method: 'POST',
    body: {
      chaincodeName,
      channelName,
      chaincodeEventName,
      notificationURL,
      startBlock,
    },
    json: true,
  });

  if (res.error) {
    throw new Meteor.Error(400, res.message);
  }
  return res;
};

Operations.updateNotificationURL = async ({ networkId, notificationURL, chaincodeName, channelName, chaincodeEventName }) => {
  if (!networkId) {
    throw new Meteor.Error(400, 'Network ID required');
  }
  const network = PrivatehivePeers.findOne({
    instanceId: networkId,
    userId: Meteor.userId(),
  });

  if (!network) {
    throw new Meteor.Error(403, 'Invalid network');
  }

  const url = `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/notifications/update`;

  const res = await request({
    uri: url,
    method: 'POST',
    body: {
      chaincodeName,
      channelName,
      chaincodeEventName,
      notificationURL,
    },
    json: true,
  });

  if (res.error) {
    throw new Meteor.Error(400, res.message);
  }

  return res;
};

Operations.removeNotificationURL = async ({ networkId, chaincodeName, channelName, chaincodeEventName }) => {
  if (!networkId) {
    throw new Meteor.Error(400, 'Network ID required');
  }
  const network = PrivatehivePeers.findOne({
    instanceId: networkId,
    userId: Meteor.userId(),
  });

  if (!network) {
    throw new Meteor.Error(403, 'Invalid network');
  }

  const url = `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/notifications/remove`;

  const res = await request({
    uri: url,
    method: 'POST',
    body: {
      chaincodeName,
      channelName,
      chaincodeEventName,
    },
    json: true,
  });

  if (res.error) {
    throw new Meteor.Error(400, res.message);
  }

  return res;
};

Operations.listNotificationURLs = async ({ networkId }) => {
  if (!networkId) {
    throw new Meteor.Error(400, 'Network ID required');
  }
  const network = PrivatehivePeers.findOne({
    instanceId: networkId,
    userId: Meteor.userId(),
  });

  if (!network) {
    throw new Meteor.Error(403, 'Invalid network');
  }

  const url = `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/notifications/list`;

  const res = await request({
    uri: url,
    method: 'GET',
    json: true,
  });

  if (res.error) {
    throw new Meteor.Error(400, res.message);
  }

  return res.message;
};

Operations.invokeOrQueryChaincode = async ({ channelName, chaincodeName, functionName, args, networkId, action }) => {
  if (!networkId) {
    throw new Meteor.Error(400, 'Network ID required');
  }
  const network = PrivatehivePeers.findOne({
    instanceId: networkId,
    userId: Meteor.userId(),
  });

  if (!network) {
    throw new Meteor.Error(403, 'Invalid network');
  }

  if (!(chaincodeName && channelName, functionName, args)) {
    throw new Meteor.Error(400, 'Channel, Chaincode, function and args are required');
  }

  if (!['invoke', 'query'].includes(action)) {
    throw new Meteor.Error(400, 'Invalid action');
  }

  if (typeof args !== 'object') {
    try {
      args = JSON.parse(args);
    } catch (err) {
      throw new Meteor.Error(400, 'Args should be a json array');
    }
  }

  const url = `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/chaincodes/${action}`;

  const res = await request({
    uri: url,
    method: 'POST',
    body: {
      channelName,
      chaincodeName,
      fcn: functionName,
      args,
    },
    json: true,
  });

  if (res.error) {
    console.log(res.message);
    throw new Meteor.Error(400, res.message);
  }

  return res.message;
};

Operations.upgradeChaincode = async ({ file, content, name, type, networkId, version }) => {
  if (!networkId) {
    throw new Meteor.Error(400, 'Network ID required');
  }
  const userId = Meteor.userId();

  const network = PrivatehivePeers.findOne({
    instanceId: networkId,
    userId,
  });

  if (!network) {
    throw new Meteor.Error(403, 'Invalid network');
  }

  let filePath;
  try {
    filePath = await uploadFile(`${userId}-${network.name.replace(/\s/g, '_')}-${name}`, content);
  } catch (err) {
    throw new Meteor.Error(err);
  }

  const url = `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/chaincodes/upgrade`;
  const chaincodeRequest = request.post(url);
  const form = chaincodeRequest.form();

  form.append('chaincode_zip', fs.createReadStream(filePath));
  form.append('chaincodeName', name);
  form.append('chaincodeLanguage', type);
  form.append('chaincodeVersion', version);

  const res = await chaincodeRequest;

  if (res.error) {
    throw new Meteor.Error(res.message);
  }

  return true;
};

Meteor.methods({
  addChaincode: Operations.addChaincode,
  fetchChaincodes: Operations.fetchChaincodes,
  installChaincode: Operations.installChaincode,
  instantiateChaincode: Operations.instantiateChaincode,
  fetchChannels: Operations.fetchChannels,
  addChaincodeNotification: Operations.addNotificationURL,
  updateChaincodeNotification: Operations.updateNotificationURL,
  removeChaincodeNotification: Operations.removeNotificationURL,
  listChaincodeNotifications: Operations.listNotificationURLs,
  invokeOrQueryChaincode: Operations.invokeOrQueryChaincode,
  upgradeChaincode: Operations.upgradeChaincode,
});
