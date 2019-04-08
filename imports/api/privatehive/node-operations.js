import moment from 'moment';
import fs from 'fs';
import request from 'request-promise';

import helpers from '../../modules/helpers';
import Config from '../../modules/config/server';
import { PrivatehiveOrderers } from '../../collections/privatehiveOrderers/privatehiveOrderers.js';
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

  return request({
    uri: `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/channels/list`,
    method: 'GET',
    json: true,
  });
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

  return request({
    uri: `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/chaincodes/install`,
    method: 'POST',
    body: {
      chaincodeName: name,
    },
    json: true,
  });
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

  return request({
    uri: `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/chaincodes/install`,
    method: 'POST',
    body: {
      chaincodeName: name,
      channelName,
      functionName,
      args,
      endorsmentPolicy,
    },
    json: true,
  });
};

Meteor.methods({
  addChaincode: Operations.addChaincode,
  fetchChaincodes: Operations.fetchChaincodes,
  installChaincode: Operations.installChaincode,
  instantiateChaincode: Operations.instantiateChaincode,
  fetchChannels: Operations.fetchChannels,
});
