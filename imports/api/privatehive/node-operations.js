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

  console.log(filePath, res);

  if (res.error) {
    throw new Meteor.Error(res.message);
  }

  return true;
};

Operations.fetchChaincodes = async ({ networkId }) => {
  const userId = Meteor.userId();

  const network = PrivatehivePeers.findOne({
    instanceId: networkId,
    userId,
  });

  if (!network) {
    throw new Meteor.Error(403, 'Invalid network');
  }

  const res = await request.get(`http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/chaincodes/list`);

  return JSON.parse(res);
};

Operations.installChaincode = async ({ name, type, version, networkId }) => {
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
    throw new Meteor.Error(res.message);
  }
};

Operations.instantiateChaincode = async ({ name, channelName, functionName, args, endorsmentPolicy, networkId }) => {
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
    throw new Meteor.Error('Error occured', res.message);
  }

  return res;
};

Operations.addNotificationURL = async ({ networkId, notificationURL, chaincodeName, channelName, chaincodeEventName, startBlock }) => {
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
    throw new Meteor.Error('Error occured', res.message);
  }

  return res;
};

Operations.updateNotificationURL = async ({ networkId, notificationURL, chaincodeName, channelName, chaincodeEventName }) => {
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
    throw new Meteor.Error('Error occured', res.message);
  }

  return res;
};

Operations.removeNotificationURL = async ({ networkId, chaincodeName, channelName, chaincodeEventName }) => {
  const network = PrivatehivePeers.findOne({
    instanceId: networkId,
    userId: Meteor.userId(),
  });

  if (!network) {
    throw new Meteor.Error(403, 'Invalid network');
  }

  const url = `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/notifications/remove`;

  console.log('Deleting', chaincodeEventName, chaincodeName, channelName);
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
    throw new Meteor.Error('Error occured', res.message);
  }

  return res;
};

Operations.listNotificationURLs = async ({ networkId }) => {
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
  return res.message;
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
});
