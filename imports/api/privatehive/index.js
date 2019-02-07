import AWS from 'aws-sdk';

import PrivateHiveCollection from '../../collections/privatehive';
import Voucher from '../../collections/vouchers/voucher';
import Bull from '../../modules/schedulers/bull';
import PrivateHiveServer from './server-communicator';

const debug = require('debug')('api:privatehive');

const EFS_AWS_ACCESS_KEY_ID = 'AKIAIYQD6G6A45MN3GJA';
const EFS_AWS_SECRET_ACCESS_KEY = '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';

const allowedChars = 'abcdefghijklmnpqrstuvwxyz';
const ID_LENGTH = 10;

const EFSParams = {
  accessKeyId: EFS_AWS_ACCESS_KEY_ID,
  secretAccessKey: EFS_AWS_SECRET_ACCESS_KEY,
  apiVersion: '2015-02-01',
};

const PrivateHive = {};

PrivateHive.Helpers = {};

PrivateHive.Helpers.generateInstance = async () => {
  const result = ['ph-'];
  for (let i = 0; i < ID_LENGTH; i++) {
    result.push(allowedChars[Math.floor(Math.random() * allowedChars.length)]);
  }

  try {
    // Since there is a unique constraint in mongo instanceId, uniqueness will be handled there
    const docId = PrivateHiveCollection.insert({
      instanceId: result.join(''),
    });
    return docId;
  } catch (err) {
    return PrivateHive.Helpers.generateInstance();
  }
};

PrivateHive.Helpers.createAWS_EFSDrive = ({ instanceId, locationCode }) => {
  return new Promise((resolve, reject) => {
    const params = {
      CreationToken: instanceId,
      PerformanceMode: 'generalPurpose',
      Encrypted: false,
      ThroughputMode: 'bursting',
    };
    const EFS = new AWS.EFS({ ...EFSParams, region: locationCode });
    EFS.createFileSystem(params, (err, data) => {
      debug('Create NFS', instanceId, err, data);
      if (err) return reject(err);
      const { CreationTime, FileSystemId, LifeCycleState, OwnerId } = data;
      return resolve({
        instanceId,
        CreationTime,
        FileSystemId,
        LifeCycleState,
        OwnerId,
      });
    });
  });
};

PrivateHive.Helpers.isAWS_EFSDriveReady = async ({ FileSystemId }) => {
  return new Promise((resolve, reject) => {
    const params = { FileSystemId };
    const EFS = new AWS.EFS({ ...EFSParams, region: locationCode });
    EFS.describeFileSystems(params, (err, data) => {
      debug('Describe NFS', FileSystemId, err, data);
      if (err) {
        ElasticLogger.log('Describe EFS drive failed', err);
        return resolve(false);
      }
      const fileSystem = data[0];
      if (!fileSystem) {
        return resolve(false);
      }
      if (fileSystem.LifeCycleState === 'available') {
        return resolve(true);
      }
      if (['deleting', 'deleted'].includes(fileSystem.LifeCycleState)) {
        return reject(new Error('EFS in being deleted or is deleted'));
      }
      return resolve(false);
    });
  });
};

/* Add functions in this namespace so that it can be directly called when giving privatehive API endpoints for API access */
PrivateHive._createPrivateHiveNetwork = ({ id, domain, locationCode, kafka, orderer, peer, data, fabric, nfsServer, organizations, domains }) => {
  if (!(id && domain && id === domain && locationCode)) {
    throw new Meteor.Error('bad-request', 'Some fields are missing');
  }

  if (!nfsServer) {
    throw new Meteor.Error('bad-request', 'NFS server not specified');
  }

  const numbericObjects = [kafka, orderer, peer, data];
  numbericObjects.forEach(obj => {
    Object.keys(obj).forEach(key => {
      obj[key] = Number(obj[key]);
    });
  });

  if (!organizations) {
    organizations = [id];
  }

  if (!domains) {
    domains = [domain];
  }

  return new Promise((resolve, reject) => {
    /* This invokes the CreatePrivateHive method in the privatehive server. No HTTP calls or endpoints to look for. Same function names to be used here and that server */
    PrivateHiveServer.CreatePrivateHive(
      {
        id,
        domain,
        locationCode,
        kafka,
        orderer,
        peer,
        data,
        fabric,
        nfsServer,
        organizations,
        domains,
      },
      (err, response) => {
        if (err) {
          debug('GRPC CreatePrivateHiveNetwork', { id, nfs, err });
          ElasticLogger.log('GRPC Create PrivateHive Error', {
            id,
            nfs,
            locationCode,
            err,
          });
          return reject(new Error('bad-request', err));
        }
        debug('Response from privatehive server', response);
        return resolve(true);
      }
    );
  });
};

PrivateHive.initializeNetwork = async ({ name, networkConfig, voucherId, locationCode, userId }) => {
  userId = userId || Meteor.userId();
  const _id = await PrivateHive.Helpers.generateInstance();

  let voucher;
  if (voucherId) {
    voucher = Voucher.find({ _id: voucher }).fetch()[0];
  }

  PrivateHiveCollection.update(
    {
      _id,
    },
    {
      $set: {
        name,
        networkConfig,
        voucher,
        locationCode,
        createdAt: new Date(),
        userId,
        isJoined: false,
        properties: {},
        nfs: {},
        status: 'initializing',
      },
    }
  );

  // Bull.addJob('create-privatehive-node', { _id });
  return true;
};

PrivateHive.getPrivateHiveNetworkCount = async () => {
  const userId = Meteor.userId();
  return PrivateHiveCollection.find({ active: true, deletedAt: null, userId }).count();
};

/* Meteor methods so that our frontend can call these function without using HTTP calls. Although I would prefer to use HTTP instead of meteor method. */
Meteor.methods({
  initializePrivateHiveNetwork: PrivateHive.initializeNetwork,
});

export default PrivateHive;
