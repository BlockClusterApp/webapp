import AWS from 'aws-sdk';
import moment from 'moment';

import PrivateHiveCollection from '../../collections/privatehive';
import Voucher from '../../collections/vouchers/voucher';
import Bull from '../../modules/schedulers/bull';
import PrivateHiveServer from './server-communicator';
import NetworkConfiguration from '../../collections/network-configuration/network-configuration';

const debug = require('debug')('api:privatehive');

const EFS_AWS_ACCESS_KEY_ID = 'AKIAIYQD6G6A45MN3GJA';
const EFS_AWS_SECRET_ACCESS_KEY = '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';

const EXTRA_STORAGE_COST = 0.5 / (30 * 24); // 0.5 per GB per month

const allowedChars = 'abcdefghijklmnpqrstuvwxyz';
const ID_LENGTH = 10;

const EFSParams = {
  accessKeyId: EFS_AWS_ACCESS_KEY_ID,
  secretAccessKey: EFS_AWS_SECRET_ACCESS_KEY,
  apiVersion: '2015-02-01',
};

const PrivateHive = {};

PrivateHive.Helpers = {};

function convertMilliseconds(ms) {
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return { seconds, minutes, hours, days };
}

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
    if (['development'].includes(process.env.NODE_ENV)) {
      return resolve({
        instanceId,
        CreationTime: new Date(),
        FileSystemId: locationCode === 'us-west-2' ? 'fs-3fdead97' : '',
        LifeCycleState: 'available',
        OwnerId: '402432300121',
      });
    }
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

PrivateHive.Helpers.isAWS_EFSDriveReady = async ({ FileSystemId, locationCode }) => {
  return new Promise((resolve, reject) => {
    const params = { FileSystemId };
    const EFS = new AWS.EFS({ ...EFSParams, region: locationCode });
    EFS.describeFileSystems(params, (err, data) => {
      data = data.FileSystems;
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

PrivateHive.generateBill = async ({ userId, month, year, isFromFrontend }) => {
  month = month === undefined ? moment().month() : month;
  year = year || moment().year();
  const selectedMonth = moment()
    .year(year)
    .month(month);
  const currentTime = moment();

  let calculationEndDate = selectedMonth.endOf('month').toDate();
  if (currentTime.isBefore(selectedMonth)) {
    calculationEndDate = currentTime.toDate();
  }

  const result = {
    totalAmount: 0,
  };

  const userNetworks = PrivateHiveCollection.find({
    userId: userId,
    createdAt: {
      $lt: calculationEndDate,
    },
    $or: [
      { deletedAt: null },
      {
        deletedAt: {
          $gte: selectedMonth.startOf('month').toDate(),
        },
      },
    ],
  }).fetch();

  result.networks = userNetworks
    .map(network => {
      let thisCalculationEndDate = calculationEndDate;
      if (network.deletedAt && moment(network.deletedAt).isBefore(calculationEndDate.getTime())) {
        thisCalculationEndDate = new Date(network.deletedAt);
      }

      let billingStartDate = selectedMonth.startOf('month').toDate();
      if (moment(billingStartDate).isBefore(moment(network.createdAt))) {
        billingStartDate = moment(network.createdAt).toDate();
      }

      const price = Number(network.networkConfig.cost.hourly);

      const time = convertMilliseconds(thisCalculationEndDate.getTime() - billingStartDate.getTime());
      const rate = price; // per month
      const ratePerHour = rate;
      const ratePerMinute = ratePerHour / 60;

      const voucher = network.voucher;

      /**
       * First Time inside Voucher Object voucher_claim_status array is of length 0.
       * when we generate bill after month check if recurring type voucher of not.
       * if recurring type voucher:
       *         check the `voucher.usability.no_months` field conatins value for recurring.
       *         now on applying voucher insert a doc in voucher.voucher_claim_status.
       *         and every time before applying voucher in bill, check this if `voucher.usability.no_months` is less than
       *         the inserted docs in `voucher_claim_status` or not.
       *          if not then understad, limit of recurring is over, dont consider.
       * if not recuring:
       *         after applying voucher we are inserting a doc in the same voucher_claim_status field.
       *         and also every time before applying ,checking if voucher_claim_status legth is 0 or more.
       *         if 0 then that means first time, good to go. if there is any. then dont consider to apply.
       *
       * And Also check for expiry date.
       */
      let voucher_usable;
      let voucher_expired;
      if (voucher) {
        if (!voucher.usability) {
          voucher.usability = {
            recurring: false,
            no_months: 0,
            once_per_user: true,
            no_times_per_user: 1,
          };
        }
        if (!voucher.availability) {
          voucher.availability = {
            card_vfctn_needed: true,
            for_all: false,
            email_ids: [],
          };
        }
        if (!voucher.discount) {
          voucher.discount = {
            value: 0,
            percent: false,
          };
        }

        voucher_usable =
          voucher.usability.recurring == true
            ? voucher.usability.no_months > (voucher.voucher_claim_status ? voucher.voucher_claim_status.length : 0)
              ? true
              : false
            : (voucher.voucher_claim_status
              ? voucher.voucher_claim_status.length
              : false)
            ? false
            : true;

        if (voucher.locationMapping) {
          vouchar_usable = vouchar_usable && !!voucher.locationMapping[network.locationCode];
        }

        voucher_expired = voucher.expiryDate ? new Date(voucher.expiryDate) <= new Date() : false;
      }

      let discountValue = 0;
      let cost = Number(time.hours * ratePerHour + (time.minutes % 60) * ratePerMinute).toFixed(2);

      let label = voucher ? voucher.code : null;

      if (voucher && voucher._id && voucher_usable) {
        let discount = voucher.discount.value || 0;
        if (voucher.discount.percent) {
          //in this case discout value will be percentage of discount.
          cost = cost * ((100 - discount) / 100);
        } else {
          cost = Math.max(cost - discount, 0);
        }
        discountValue = discount;

        //so that we can track record how many times he used.
        //and also helps to validate if next time need to consider voucher or not.
        if (!isFromFrontend) {
          PrivateHiveCollection.update(
            { _id: network._id },
            {
              $push: {
                'voucher.voucher_claim_status': {
                  claimedBy: userId,
                  claimedOn: new Date(),
                  claimed: true,
                },
              },
            }
          );
        }
      }

      let extraDiskStorage = 0;

      const actualNetworkConfig = NetworkConfiguration.find({ _id: network.networkConfig._id, active: { $in: [true, false, null] } }).fetch()[0];

      if (network.networkConfig.orderer.disk > actualNetworkConfig.orderer.disk) {
        extraDiskStorage += Math.max(network.networkConfig.orderer.disk - actualNetworkConfig.orderer.disk, 0);
      }
      if (network.networkConfig.kafka.disk > actualNetworkConfig.kafka.disk) {
        extraDiskStorage += Math.max(network.networkConfig.kafka.disk - actualNetworkConfig.kafka.disk, 0);
      }
      if (network.networkConfig.data.disk > actualNetworkConfig.data.disk) {
        extraDiskStorage += Math.max(network.networkConfig.data.disk - actualNetworkConfig.data.disk, 0);
      }

      const extraDiskAmount = extraDiskStorage * (EXTRA_STORAGE_COST * time.hours);

      // Just a precaution
      if (network.deletedAt && moment(network.deletedAt).isBefore(selectedMonth.startOf('month'))) {
        return undefined;
      }

      result.totalAmount += Number(cost);
      function floorFigure(figure, decimals) {
        if (!decimals) decimals = 3;
        var d = Math.pow(10, decimals);
        return (parseInt(figure * d) / d).toFixed(decimals);
      }
      return {
        name: network.name,
        instanceId: network.instanceId,
        createdOn: new Date(network.createdAt),
        rate: ` $ ${floorFigure(rate, 3)} / hr `, //taking upto 3 decimals , as shown in pricing page
        runtime: `${time.hours}:${time.minutes % 60 < 10 ? `0${time.minutes % 60}` : time.minutes % 60} hrs | ${extraDiskStorage} GB extra`,
        cost,
        time,
        deletedAt: network.deletedAt,
        voucher: voucher,
        networkConfig: network.networkConfig,
        discount: Number(discountValue || 0).toFixed(2),
        label,
        timeperiod: `Started at: ${moment(network.createdOn).format('DD-MMM-YYYY kk:mm')} ${
          network.deletedAt ? ` to ${moment(network.deletedAt).format('DD-MMM-YYYY kk:mm:ss')}` : 'and still running'
        }`,
      };
    })
    .filter(n => !!n);

  result.totalAmount = Math.max(result.totalAmount, 0);

  return result;
};

/* Add functions in this namespace so that it can be directly called when giving privatehive API endpoints for API access */
PrivateHive._createPrivateHiveNetwork = ({ id, domain, locationCode, kafka, orderer, peer, data, fabric, nfsServer, organizations, domains }) => {
  if (!(id && domain && id === domain && locationCode)) {
    throw new Meteor.Error('bad-request', 'Some fields are missing');
  }

  if (!nfsServer) {
    throw new Meteor.Error('bad-request', 'NFS server not specified');
  }

  id = id.split('-')[1];
  domain = domain.split('-')[1];

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
      { deadline: new Date().setSeconds(new Date().getSeconds() + 10) },
      (err, response) => {
        if (err) {
          debug('GRPC CreatePrivateHiveNetwork', { id, nfsServer, err });
          ElasticLogger.log('GRPC Create PrivateHive Error', {
            id,
            nfsServer,
            locationCode,
            err,
          });
          return reject(new Error(err));
        }
        debug('Response from privatehive server', response);
        return resolve(true);
      }
    );
  });
};

PrivateHive.initializeNetwork = async ({ name, networkConfig, voucherId, locationCode, userId }) => {
  networkConfig = networkConfig.config;
  userId = userId || Meteor.userId();
  const _id = await PrivateHive.Helpers.generateInstance();

  let voucher;
  const oldNetworkConfig = { ...networkConfig };
  if (voucherId) {
    voucher = Voucher.find({ _id: voucherId }).fetch()[0];
    networkConfig = NetworkConfiguration.find({ _id: voucher.networkConfig._id }).fetch()[0];
    if (networkConfig.orderer.isDiskChangeable) networkConfig.orderer.disk = oldNetworkConfig.orderer.disk;
    if (networkConfig.kafka.isDiskChangeable) networkConfig.kafka.disk = oldNetworkConfig.kafka.disk;
    if (networkConfig.data.isDiskChangeable) networkConfig.data.disk = oldNetworkConfig.data.disk;

    const tempVoucher = { ...voucher };
    delete tempVoucher.networkConfig;
    delete tempVoucher.voucher_claim_status;
    delete tempVoucher.availability;

    voucher = tempVoucher;
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
        deletedAt: null,
        userId,
        isJoin: false,
        properties: {},
        nfs: {},
        status: 'initializing',
      },
    }
  );

  Bull.addJob('create-privatehive-node', { _id });
  return true;
};

PrivateHive.getPrivateHiveNetworkCount = async () => {
  const userId = Meteor.userId();
  return PrivateHiveCollection.find({ active: true, deletedAt: null, userId }).count();
};

PrivateHive._deletePrivateHiveNetwork = ({ id, domain, locationCode, nfsServer }) => {
  return new Promise((resolve, reject) => {
    PrivateHiveServer.DeletePrivateHiveOrderer(
      {
        id,
        domain,
        locationCode,
        nfsServer,
      },
      { deadline: new Date().setSeconds(new Date().getSeconds() + 20) },
      Meteor.bindEnvironment((err, res) => {
        debug(err, res);
        if (err) {
          ElasticLogger.log(`Error deleting privatehive network`, { err, id });
          return reject(err);
        } else {
          PrivateHiveCollection.update(
            {
              instanceId: `ph-${id}`,
            },
            {
              $set: {
                status: 'deleting',
              },
            }
          );
        }
        return resolve();
      })
    );
  });
};

// Async used else meteor blocks further requests till this is completed
PrivateHive.deleteNetwork = async ({ id, userId }) => {
  userId = userId || Meteor.userId();

  const user = Meteor.users.find({ _id: userId }).fetch()[0];

  ElasticLogger.log(`PrivateHive network deletion`, { id, userId });

  const network = PrivateHiveCollection.find({ _id: id }).fetch()[0];

  if (!network) {
    throw new Meteor.Error('bad-request', 'Invalid network to delete');
  }

  if (user.admin < 2 && network.userId !== userId) {
    throw new Meteor.Error('bad-request', 'Invalid network to delete');
  }

  PrivateHiveCollection.update(
    {
      _id: network._id,
    },
    {
      $set: {
        status: 'Prepare delete',
      },
    }
  );

  Bull.addJob('delete-privatehive-node', {
    _id: network._id,
  });

  return true;
};

PrivateHive.changeName = async ({ id, newName }) => {
  const user = Meteor.user();

  ElasticLogger.log('Privatehive name change', { id, newName, userId: user._id });

  const network = PrivateHiveCollection.find({ instanceId: id, userId: user._id }).fetch()[0];

  if (!network) {
    throw new Meteor.Error('bad-request', 'Invalid network id');
  }

  PrivateHiveCollection.update(
    {
      _id: network._id,
      userId: network.userId,
    },
    {
      $set: {
        name: newName,
      },
    }
  );

  return true;
};

PrivateHive._joinPrivateHiveNetwork = async ({ id, domain, locationCode, peer, fabric, data, nfsServer, orderer }) => {
  return new Promise((resolve, reject) => {
    /* This invokes the CreatePrivateHive method in the privatehive server. No HTTP calls or endpoints to look for. Same function names to be used here and that server */
    PrivateHiveServer.JoinPrivateHive(
      {
        id,
        domain,
        locationCode,
        peer,
        data,
        fabric,
        nfsServer,
        orderer,
        peerOrgs: [orderer.id, id],
      },
      { deadline: new Date().setSeconds(new Date().getSeconds() + 20) },
      (err, response) => {
        if (err) {
          debug('GRPC JoinPrivateHive', { id, nfsServer, err });
          ElasticLogger.log('GRPC Join PrivateHive Error', {
            id,
            nfsServer,
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

PrivateHive.join = async ({ ordererId, name, networkConfig, voucherId, locationCode, userId }) => {
  networkConfig = networkConfig.config;
  userId = userId || Meteor.userId();
  const _id = await PrivateHive.Helpers.generateInstance();

  let voucher;
  const oldNetworkConfig = { ...networkConfig };
  if (voucherId) {
    voucher = Voucher.find({ _id: voucherId }).fetch()[0];
    networkConfig = NetworkConfiguration.find({ _id: voucher.networkConfig._id }).fetch()[0];
    if (networkConfig.data.isDiskChangeable) networkConfig.data.disk = oldNetworkConfig.data.disk;

    const tempVoucher = { ...voucher };
    delete tempVoucher.networkConfig;
    delete tempVoucher.voucher_claim_status;
    delete tempVoucher.availability;

    voucher = tempVoucher;
  }

  const orderer = PrivateHiveCollection.find({ _id: ordererId, deletedAt: null }).fetch()[0];

  if (!orderer) {
    throw new Meteor.Error('bad-request', 'Invalid orderer id');
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
        isJoin: true,
        properties: {},
        nfs: {},
        status: 'initializing',
        ordererId,
      },
    }
  );

  debug('Adding join privatehive', {
    _id,
    name,
    networkConfig,
    voucher,
    locationCode,
    ordererId,
  });
  Bull.addJob('join-privatehive-node', { _id, ordererId: orderer._id });
  return _id;
};

async function generatePrivateHiveToken({ instanceId }) {
  const network = PrivateHiveCollection.find({
    instanceId,
    userId: Meteor.userId(),
  }).fetch()[0];

  if (!network) {
    throw new Meteor.Error(400, 'Invalid network id');
  }

  return new Promise((resolve, reject) => {
    const endpoint = `https://${network.properties.apiEndPoint}/auth/generate`;
    HTTP.call(
      'POST',
      endpoint,
      {
        headers: {
          'x-access-key': network.properties.tokens
            ? network.properties.tokens[0]
              ? network.properties.tokens[0]
              : network.properties.externalPeers[1]
            : network.properties.externalPeers[1],
        },
      },
      (err, res) => {
        if (err) {
          return reject(err);
        }
        PrivateHiveCollection.update(
          { instanceId },
          {
            $push: {
              'properties.tokens': res.data.data,
            },
          }
        );
        return resolve(res.data.data);
      }
    );
  });
}

async function revokePrivateHiveToken({ instanceId, token }) {
  const network = PrivateHiveCollection.find({
    instanceId,
    userId: Meteor.userId(),
  }).fetch()[0];

  if (!network) {
    throw new Meteor.Error(400, 'Invalid network id');
  }
  const endpoint = `https://${network.properties.apiEndPoint}/auth`;
  HTTP.call(
    'DELETE',
    endpoint,
    {
      headers: {
        'x-access-key': token,
      },
      npmRequestOptions: {
        rejectUnauthorized: false,
      },
    },
    (err, res) => {
      console.log('Revoke token response', err, res);
    }
  );

  PrivateHiveCollection.update(
    {
      instanceId,
    },
    {
      $pull: {
        'properties.tokens': token,
      },
    }
  );

  return true;
}

/* Meteor methods so that our frontend can call these function without using HTTP calls. Although I would prefer to use HTTP instead of meteor method. */
Meteor.methods({
  initializePrivateHiveNetwork: PrivateHive.initializeNetwork,
  getPrivateHiveNetworkCount: PrivateHive.getPrivateHiveNetworkCount,
  deletePrivateHiveNetwork: PrivateHive.deleteNetwork,
  changePrivateHiveNodeName: PrivateHive.changeName,
  joinPrivateHiveNetwork: PrivateHive.join,
  generatePrivateHiveToken,
  revokePrivateHiveToken,
});

export default PrivateHive;
