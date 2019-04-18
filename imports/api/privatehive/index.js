import moment from 'moment';

import helpers from '../../modules/helpers';
import Config from '../../modules/config/server';
import { PrivatehiveOrderers } from '../../collections/privatehiveOrderers/privatehiveOrderers.js';
import { PrivatehivePeers } from '../../collections/privatehivePeers/privatehivePeers.js';
import NetworkConfig from '../../collections/network-configuration/network-configuration';
import Creators from './creators';
import request from 'request-promise';
import NetworkConfiguration from '../../collections/network-configuration/network-configuration';
import LocationConfiguration from '../../collections/locations';
import RateLimiter from '../../modules/helpers/server/rate-limiter';

import Voucher from '../network/voucher';

const EXTRA_STORAGE_COST = 0.3;
const toPascalCase = require('to-pascal-case');

function sleep(timeout) {
  return new Promise(r => {
    setTimeout(() => r(), timeout);
  });
}

let PrivateHive = {};

PrivateHive.createPeer = async ({ locationCode, orgName, networkConfig }) => {
  const instanceId = helpers.instanceIDGenerate();
  const workerNodeIP = Config.workerNodeIP(locationCode);
  const namespace = Config.namespace;

  try {
    await Creators.createPersistentvolumeclaims({ locationCode, namespace: Config.namespace, instanceId, storage: networkConfig.disk });
    peerDetails = await Creators.createPeerService({ locationCode, namespace: Config.namespace, instanceId });

    await Creators.createPeerDeployment({
      locationCode,
      namespace: Config.namespace,
      instanceId,
      workerNodeIP,
      orgName,
      networkConfig,
      anchorCommPort: peerDetails.peerGRPCAPINodePort,
      chaincodePort: peerDetails.chaincodeListenNodePort,
      caPort: peerDetails.caNodePort,
    });
    await Creators.createAPIIngress({ locationCode, namespace, instanceId });

    return { instanceId, peerDetails };
  } catch (err) {
    ElasticLogger.log('Error creating privatehive peer', { locationCode, err });
    await Creators.deletePersistentVolumeClaim({ locationCode, namespace, name: `${instanceId}-pvc` });
    await Creators.deleteService({ locationCode, namespace, name: `${instanceId}-privatehive` });
    await Creators.deleteDeployment({ locationCode, namespace, name: `${instanceId}-privatehive` });
    await Creators.deleteIngress({ locationCode, namespace, name: `${instanceId}-privatehive` });

    throw new Meteor.Error(err);
  }
};

PrivateHive.createOrderer = async ({ peerOrgName, peerAdminCert, peerCACert, peerWorkerNodeIP, anchorCommPort, locationCode, type, orgName, networkConfig }) => {
  const workerNodeIP = Config.workerNodeIP(locationCode);
  const instanceId = helpers.instanceIDGenerate();
  const namespace = Config.namespace;
  let ordererNodePort;
  try {
    type = type || 'solo';

    if (type === 'kafka') {
      await Creators.deployZookeeper({ locationCode, instanceId, namespace: Config.namespace, networkConfig });
      await Creators.deployKafka({ locationCode, namespace: Config.namespace, instanceId, networkConfig });
    }

    await Creators.createPersistentvolumeclaims({ locationCode, namespace: Config.namespace, instanceId, storage: networkConfig.disk });
    ordererNodePort = await Creators.createOrdererService({ locationCode, namespace: Config.namespace, instanceId });

    await Creators.createOrdererDeployment({
      locationCode,
      namespace: Config.namespace,
      instanceId,
      workerNodeIP,
      peerOrgName,
      peerAdminCert,
      peerCACert,
      peerWorkerNodeIP,
      anchorCommPort,
      ordererNodePort,
      type,
      orgName,
      networkConfig,
    });
    await Creators.createAPIIngress({ locationCode, namespace, instanceId });
  } catch (err) {
    ElasticLogger.log('Error creating privatehive orderer', { locationCode, err });
    if (type === 'kafka') {
      await Creators.destroyZookeper({ locationCode, namespace, instanceId });
      await Creators.destroyKafka({ locationCode, namespace, instanceId });
    }
    await Creators.deletePersistentVolumeClaim({ locationCode, namespace, name: `${instanceId}-pvc` });
    await Creators.deleteService({ locationCode, namespace, name: `${instanceId}-privatehive` });
    await Creators.deleteDeployment({ locationCode, namespace, name: `${instanceId}-privatehive` });
    await Creators.deletePrivatehiveReplicaSets({ locationCode, namespace, instanceId });
    await Creators.deleteIngress({ locationCode, namespace, name: `${instanceId}-privatehive` });

    throw new Meteor.Error(err);
  }

  return { instanceId, ordererNodePort };
};

PrivateHive.changeNetworkPassword = async ({ instanceId, password }) => {
  let network;
  const userId = Meteor.userId();
  let type = 'peer';

  network = PrivatehivePeers.findOne({ instanceId, userId });
  if (!network) {
    network = PrivatehiveOrderers.findOne({ instanceId, userId });
    type = 'orderer';
  }

  await Creators.createAPIIngress({ locationCode: network.locationCode, namespace: Config.namespace, instanceId: network.instanceId, password });
  return true;
};

PrivateHive.deleteNetwork = async ({ userId, instanceId }) => {
  let network;
  let type = 'peer';

  network = PrivatehivePeers.findOne({ instanceId, userId });
  if (!network) {
    network = PrivatehiveOrderers.findOne({ instanceId, userId });
    type = 'orderer';
  }

  if (!network) {
    throw new Meteor.Error(401, 'Invalid network');
  }

  const { locationCode } = network;
  const namespace = Config.namespace;

  if (type === 'orderer') {
    try {
      await Creators.destroyZookeper({ locationCode, namespace, instanceId });
    } catch (err) {}
    try {
      await Creators.destroyKafka({ locationCode, namespace, instanceId });
    } catch (err) {}
  }

  try {
    await Creators.deletePersistentVolumeClaim({ locationCode, namespace, name: `${instanceId}-pvc` });
  } catch (err) {}
  try {
    await Creators.deleteService({ locationCode, namespace, name: `${instanceId}-privatehive` });
  } catch (err) {}
  try {
    await Creators.deleteDeployment({ locationCode, namespace, name: `${instanceId}-privatehive` });
  } catch (err) {}
  try {
    await Creators.deletePrivatehiveReplicaSets({ locationCode, namespace, instanceId });
  } catch (err) {}
  try {
    await Creators.deleteIngress({ locationCode, namespace, name: `${instanceId}-privatehive` });
  } catch (err) {}

  if (type === 'peer') {
    PrivatehivePeers.update(
      { _id: network._id },
      {
        $set: {
          deletedAt: new Date(),
        },
      }
    );
  } else {
    PrivatehiveOrderers.update(
      {
        _id: network._id,
      },
      {
        $set: {
          deletedAt: new Date(),
        },
      }
    );
  }

  return true;
};

PrivateHive.join = async ({ networkId, channelName, peerId, peerInstanceId, userId, ordererDomain, ordererConnectionDetails }) => {
  // PlaceHolder function
  const query = { _id: peerId, userId };
  if (peerInstanceId) {
    query.instanceId = peerInstanceId;
    delete query._id;
  }
  const peer = PrivatehivePeers.findOne(query);
  if (!peer) {
    throw new Meteor.Error(403, 'Invalid network');
  }
  const network = PrivatehivePeers.findOne({ _id: networkId });
  if (!network) {
    throw new Meteor.Error(403, 'Invalid inviting network');
  }

  if (network._id === peer._id) {
    throw new Meteor.Error(403, 'Cannot join invited network');
  }

  const newOrgConf = await request({
    uri: `http://${Config.workerNodeIP(peer.locationCode)}:${peer.apiNodePort}/config/orgDetails`,
    method: 'GET',
    json: true,
  });

  const addOrgRes = await request({
    uri: `http://${Config.workerNodeIP(network.locationCode)}:${network.apiNodePort}/channel/addOrg`,
    method: 'POST',
    body: {
      name: channelName,
      newOrgName: peer.orgName,
      newOrgConf: newOrgConf.message,
    },
    json: true,
  });

  await sleep(5000);

  const res = await request({
    uri: `http://${Config.workerNodeIP(peer.locationCode)}:${peer.apiNodePort}/channel/join`,
    method: 'POST',
    body: {
      name: channelName,
      ordererURL: ordererConnectionDetails.substring(7),
      ordererDomain,
    },
    json: true,
  });

  return peerId.instanceId;
};

PrivateHive.createPrivateHiveNetwork = async ({ userId, peerId, locationCode, type, voucherId, name, orgName, ordererType, networkConfig }) => {
  const locationConfig = LocationConfiguration.findOne({ service: 'privatehive' });
  if (!locationConfig.locations.includes(locationCode)) {
    throw new Meteor.Error(403, 'Not available in this location');
  }
  if (!orgName) {
    throw new Meteor.Error(400, 'Org Name is required');
  }
  if (!['peer', 'orderer'].includes(type)) {
    throw new Meteor.Error(400, 'Type should be peer or orderer');
  }
  let voucher;
  if (voucherId) {
    voucher = await Voucher.validate({ type: 'privatehive', userId, voucherId });

    if (!voucher) {
      throw new Meteor.Error(400, 'Invalid voucher');
    }

    const tempVoucher = { ...voucher };
    delete tempVoucher.networkConfig;
    delete tempVoucher.voucher_claim_status;
    delete tempVoucher.availability;

    voucher = tempVoucher;
  }

  if (!networkConfig && type === 'peer') {
    throw new Meteor.Error(403, 'Network config not provided');
  }

  let originalNetworkConfig;

  if (type === 'peer') {
    originalNetworkConfig = NetworkConfig.findOne({ _id: networkConfig._id, for: 'privatehive' });
  } else if (type === 'orderer') {
    originalNetworkConfig = NetworkConfig.findOne({ for: 'privatehive', active: true, ordererType, category: 'orderer' });
    networkConfig = JSON.parse(JSON.stringify(originalNetworkConfig));
  }

  if (!originalNetworkConfig) {
    throw new Meteor.Error(403, 'Invalid config not provided');
  }

  if (originalNetworkConfig.category === 'peer') {
  } else if (originalNetworkConfig.category === 'orderer') {
    if (originalNetworkConfig.ordererType !== ordererType) {
      throw new Meteor.Error(403, 'Orderer type - network config mismatch');
    }
    networkConfig.disk = originalNetworkConfig.isDiskChangeable ? networkConfig.disk : originalNetworkConfig.disk;
    if (originalNetworkConfig.ordererType === 'kafka') {
      // Check and assign disk space
      networkConfig.kafka.disk = originalNetworkConfig.kafka.isDiskChangeable ? networkConfig.kafka.disk || originalNetworkConfig.kafka.disk : originalNetworkConfig.kafka.disk;
      networkConfig.zookeeper.disk = originalNetworkConfig.zookeeper.isDiskChangeable
        ? networkConfig.zookeeper.disk || originalNetworkConfig.zookeeper.disk
        : originalNetworkConfig.zookeeper.disk;

      networkConfig.kafka.cpu = originalNetworkConfig.kafka.cpu;
      networkConfig.kafka.ram = originalNetworkConfig.kafka.ram;
      networkConfig.zookeeper.cpu = originalNetworkConfig.zookeeper.cpu;
      networkConfig.zookeeper.ram = originalNetworkConfig.zookeeper.ram;
    }
    networkConfig.ordererType = originalNetworkConfig.ordererType;
  } else {
    throw new Meteor.Error(403, 'Invalid config category');
  }

  networkConfig.disk = originalNetworkConfig.isDiskChangeable ? networkConfig.disk || originalNetworkConfig.disk : originalNetworkConfig.disk;
  networkConfig.cpu = originalNetworkConfig.cpu;
  networkConfig.ram = originalNetworkConfig.ram;
  networkConfig.cost = originalNetworkConfig.cost;

  const commonData = { userId, locationCode, voucher, name, networkConfig };

  ElasticLogger.log('Creating Privatehive network', { userId, networkConfig, locationCode, voucher, name, type, ordererType });

  const isAllowed = await RateLimiter.isAllowed('privatehive-create', userId);
  if (!isAllowed) {
    throw new Meteor.Error(429, 'Rate limit exceeded. Try after 1 minute');
  }

  let result;
  if (networkConfig.category === 'peer') {
    let peerDetails = await PrivateHive.createPeer({ locationCode, orgName, networkConfig });
    PrivatehivePeers.insert({
      instanceId: peerDetails.instanceId,
      orgName: toPascalCase(orgName),
      apiNodePort: peerDetails.peerDetails.peerAPINodePort,
      anchorCommPort: peerDetails.peerDetails.peerGRPCAPINodePort,
      caNodePort: peerDetails.peerDetails.caNodePort,
      workerNodeIP: Config.workerNodeIP(peerDetails.locationCode),
      ...commonData,
    });
    result = peerDetails.instanceId;
  } else if (networkConfig.category === 'orderer') {
    let peerDetails = PrivatehivePeers.findOne({
      instanceId: peerId,
    });

    if (!peerDetails) {
      throw new Meteor.Error(403, 'Invalid peer');
    }

    if (peerDetails.status !== 'running') {
      throw new Meteor.Error(400, 'Peer not ready');
    }

    async function getCerts(peer) {
      return new Promise((resolve, reject) => {
        HTTP.call('GET', `http://${Config.workerNodeIP(peer.locationCode)}:${peer.apiNodePort}/config/ordererCerts`, {}, (error, response) => {
          if (error) {
            reject();
          } else {
            resolve(response.data.message);
          }
        });
      });
    }

    let certs = await getCerts(peerDetails);
    let ordererDetails = await PrivateHive.createOrderer({
      peerOrgName: peerDetails.orgName,
      peerAdminCert: certs.adminCert,
      peerCACert: certs.caCert,
      peerWorkerNodeIP: Config.workerNodeIP(peerDetails.locationCode),
      anchorCommPort: peerDetails.anchorCommPort,
      locationCode,
      orgName,
      networkConfig,
      type: ordererType,
    });
    PrivatehiveOrderers.insert({
      instanceId: ordererDetails.instanceId,
      ordererNodePort: ordererDetails.ordererNodePort,
      workerNodeIP: Config.workerNodeIP(peerDetails.locationCode),
      ordererType,
      orgName: toPascalCase(orgName),
      ...commonData,
    });
    result = ordererDetails.instanceId;
  } else {
    throw new Meteor.Error(400, 'Invalid network type');
  }

  if (voucherId) {
    Vouchers.update(
      { _id: nodeConfig.voucherId },
      {
        $push: {
          voucher_claim_status: {
            claimedBy: userId,
            claimedOn: new Date(),
            claimed: true,
          },
        },
      }
    );
  }

  return result;
};

PrivateHive.getPrivateHiveNetworkCount = async () => {
  const userId = Meteor.userId();
  return PrivatehiveOrderers.find({ active: true, deletedAt: null, userId }).count() + PrivatehivePeers.find({ active: true, deletedAt: null, userId }).count();
};

Meteor.methods({
  initializePrivateHiveNetwork: async ({ peerId, locationCode, type, name, orgName, voucherId, ordererType, networkConfig }) => {
    const res = await PrivateHive.createPrivateHiveNetwork({ userId: Meteor.userId(), peerId, locationCode, type, name, orgName, voucherId, ordererType, networkConfig });
    return res;
  },
  getPrivateHiveNetworkCount: PrivateHive.getPrivateHiveNetworkCount,
  deletePrivateHiveNetwork: async ({ instanceId }) => {
    return PrivateHive.deleteNetwork({ userId: Meteor.userId(), instanceId });
  },
  privatehiveRpcPasswordUpdate: PrivateHive.changeNetworkPassword,
  privatehiveCreateChannel: async ({ peerId, ordererId, channelName, userId }) => {
    userId = userId || Meteor.userId();

    let peerDetails = PrivatehivePeers.findOne({
      instanceId: peerId,
      userId,
    });

    let ordererDetails = PrivatehiveOrderers.findOne({
      instanceId: ordererId,
      userId,
    });

    async function createChannel() {
      return new Promise((resolve, reject) => {
        console.log({
          name: channelName,
          ordererURL: `${Config.workerNodeIP(ordererDetails.locationCode)}:${ordererDetails.ordererNodePort}`,
          ordererDomain: `orderer.${ordererDetails.orgName.toLowerCase()}.com`,
        });
        HTTP.call(
          'POST',
          `http://${Config.workerNodeIP(peerDetails.locationCode)}:${peerDetails.apiNodePort}/channel/create`,
          {
            data: {
              name: channelName,
              ordererURL: `${Config.workerNodeIP(ordererDetails.locationCode)}:${ordererDetails.ordererNodePort}`,
              ordererDomain: `orderer.${ordererDetails.orgName.toLowerCase()}.com`,
            },
          },
          (error, response) => {
            if (error) {
              reject();
            } else {
              console.log('Create channel response', response);
              resolve(response.data);
            }
          }
        );
      });
    }

    const channel = await createChannel();

    if (channel.error) {
      throw new Meteor.Error(500, channel.message);
    }

    return channelName;
  },
  privatehiveJoinChannel: async (peerId, ordererId, newPeerId, channelName) => {
    let peerDetails = PrivatehivePeers.findOne({
      instanceId: peerId,
    });

    let newPeerDetails = PrivatehivePeers.findOne({
      instanceId: newPeerId,
    });

    let ordererDetails = PrivatehiveOrderers.findOne({
      instanceId: ordererId,
    });

    async function getDetails() {
      return new Promise((resolve, reject) => {
        HTTP.call('GET', `http://${newConfig.workerNodeIP(peerDetails.locationCode)}:${newPeerDetails.apiNodePort}/config/orgDetails`, {}, (error, response) => {
          if (error) {
            reject();
          } else {
            resolve(response.data);
          }
        });
      });
    }

    async function addNewOrgToChannel(details) {
      return new Promise((resolve, reject) => {
        HTTP.call(
          'POST',
          `http://${Config.workerNodeIP(peerDetails.locationCode)}:${peerDetails.apiNodePort}/addOrgToChannel`,
          {
            data: {
              name: channelName,
              newOrgName: newPeerDetails.instanceId,
              newOrgConf: details.message,
            },
          },
          (error, response) => {
            if (error) {
              reject();
            } else {
              resolve(response.data);
            }
          }
        );
      });
    }

    async function joinChannel() {
      return new Promise((resolve, reject) => {
        HTTP.call(
          'POST',
          `http://${newConfig.workerNodeIP(peerDetails.locationCode)}:${newPeerDetails.apiNodePort}/joinChannel`,
          {
            data: {
              name: channelName,
              ordererURL: `${Config.workerNodeIP(ordererDetails.locationCode)}:${ordererDetails.ordererNodePort}`,
              ordererDomain: `orderer.${ordererDetails.orgName.toLowerCase()}.com`,
            },
          },
          (error, response) => {
            if (error) {
              reject();
            } else {
              resolve(response.data);
            }
          }
        );
      });
    }

    let details = await getDetails();
    await addNewOrgToChannel(details);
    await joinChannel();

    return channelName;
  },
});

function convertMilliseconds(ms) {
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return { seconds, minutes, hours, days };
}

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

  const userNetworks = [
    ...PrivatehiveOrderers.find({
      userId: userId,
      createdAt: {
        $lt: calculationEndDate,
      },
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } },
        {
          deletedAt: {
            $gte: selectedMonth.startOf('month').toDate(),
          },
        },
      ],
    })
      .fetch()
      .map(m => ({ ...m, type: 'orderer' })),
    ...PrivatehivePeers.find({
      userId: userId,
      createdAt: {
        $lt: calculationEndDate,
      },
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } },
        {
          deletedAt: {
            $gte: selectedMonth.startOf('month').toDate(),
          },
        },
      ],
    })
      .fetch()
      .map(m => ({ ...m, type: 'peer' })),
  ];

  result.networks = userNetworks
    .filter(n => !!n.networkConfig)
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
          let Model = PrivatehiveOrderers;
          if (network.type === 'peer') {
            Model = PrivatehivePeers;
          }
          Model.update(
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

      const actualNetworkConfig = NetworkConfiguration.findOne({ _id: network.networkConfig._id, active: { $in: [true, false, null] } });

      if (network.networkConfig.disk > actualNetworkConfig.disk) {
        extraDiskStorage += Math.max(network.networkConfig.disk - actualNetworkConfig.disk, 0);
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

export default PrivateHive;
