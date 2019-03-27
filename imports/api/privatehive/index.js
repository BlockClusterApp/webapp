import moment from 'moment';

import helpers from '../../modules/helpers';
import Config from '../../modules/config/server';
import { PrivatehiveOrderers } from '../../collections/privatehiveOrderers/privatehiveOrderers.js';
import { PrivatehivePeers } from '../../collections/privatehivePeers/privatehivePeers.js';
import Creators from './creators';

let PrivateHive = {};

PrivateHive.createPeer = async ({ locationCode }) => {
  const instanceId = helpers.instanceIDGenerate();
  const workerNodeIP = Config.workerNodeIP(locationCode);
  const namespace = Config.namespace;

  try {
    await Creators.createPersistentvolumeclaims({ locationCode, namespace: Config.namespace, instanceId, storage: 50 });
    peerDetails = await Creators.createPeerService({ locationCode, namespace: Config.namespace, instanceId });

    await Creators.createPeerDeployment({ locationCode, namespace: Config.namespace, instanceId, workerNodeIP, anchorCommPort: peerDetails.peerGRPCAPINodePort });

    return { instanceId, peerDetails };
  } catch (err) {
    await Creators.deletePersistentVolumeClaim({ locationCode, namespace, name: `${instanceId}-pvc` });
    await Creators.deleteService({ locationCode, namespace, name: `${instanceId}-privatehive` });
    await Creators.deleteDeployment({ locationCode, namespace, name: `${instanceId}-privatehive` });

    throw new Meteor.Error(err);
  }
};

PrivateHive.createOrderer = async ({ peerOrgName, peerAdminCert, peerCACert, peerWorkerNodeIP, anchorCommPort, locationCode }) => {
  const workerNodeIP = Config.workerNodeIP(locationCode);
  const instanceId = helpers.instanceIDGenerate();
  const namespace = Config.namespace;
  let ordererNodePort;
  try {
    await Creators.deployZookeeper({ locationCode, instanceId, namespace: Config.namespace });
    await Creators.deployKafka({ locationCode, namespace: Config.namespace, instanceId });

    await Creators.createPersistentvolumeclaims({ locationCode, namespace: Config.namespace, instanceId, storage: 50 });
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
    });
  } catch (err) {
    await Creators.destroyZookeper({ locationCode, namespace, instanceId });
    await Creators.destroyKafka({ locationCode, namespace, instanceId });
    await Creators.deletePersistentVolumeClaim({ locationCode, namespace, name: `${instanceId}-pvc` });
    await Creators.deleteService({ locationCode, namespace, name: `${instanceId}-privatehive` });
    await Creators.deleteDeployment({ locationCode, namespace, name: `${instanceId}-privatehive` });
    await Creators.deletePrivatehiveReplicaSets({ locationCode, namespace, instanceId });

    throw new Meteor.Error(err);
  }

  return { instanceId, ordererNodePort };
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

PrivateHive.createPrivateHiveNetwork = async ({ userId, peerId, locationCode, type, voucherId, name }) => {
  let voucher;
  if (voucherId) {
    voucher = Voucher.find({ _id: voucherId }).fetch()[0];

    if (!voucher) {
      throw new Meteor.Error(400, 'Invalid voucher');
    }

    const tempVoucher = { ...voucher };
    delete tempVoucher.networkConfig;
    delete tempVoucher.voucher_claim_status;
    delete tempVoucher.availability;

    voucher = tempVoucher;
  }

  const commonData = { userId, locationCode, voucher, name };

  if (type === 'peer') {
    let peerDetails = await PrivateHive.createPeer({ locationCode });
    PrivatehivePeers.insert({
      instanceId: peerDetails.instanceId,
      apiNodePort: peerDetails.peerDetails.peerAPINodePort,
      anchorCommPort: peerDetails.peerDetails.peerGRPCAPINodePort,
      ...commonData,
    });
    return peerDetails.instanceId;
  } else if (type === 'orderer') {
    let peerDetails = PrivatehivePeers.findOne({
      instanceId: peerId,
    });

    if (!peerDetails) {
      throw new Meteor.Error(403, 'Invalid peer');
    }

    console.log('Peer', peerDetails);

    async function getCerts(peer) {
      return new Promise((resolve, reject) => {
        HTTP.call('GET', `http://${Config.workerNodeIP(peer.locationCode)}:${peer.apiNodePort}/channelConfigCerts`, {}, (error, response) => {
          if (error) {
            reject();
          } else {
            resolve(response.data);
          }
        });
      });
    }

    let certs = await getCerts(peerDetails);
    let ordererDetails = await PrivateHive.createOrderer({
      peerOrgName: peerId,
      peerAdminCert: certs.adminCert,
      peerCACert: certs.caCert,
      peerWorkerNodeIP: Config.workerNodeIP(peerDetails.locationCode),
      anchorCommPort: peerDetails.anchorCommPort,
      locationCode,
    });
    PrivatehiveOrderers.insert({
      instanceId: ordererDetails.instanceId,
      ordererNodePort: ordererDetails.ordererNodePort,
      workerNodeIP: Config.workerNodeIP(peerDetails.locationCode),
      ...commonData,
    });
    return ordererDetails.instanceId;
  } else {
    throw new Meteor.Error(400, 'Invalid network type');
  }
};

PrivateHive.getPrivateHiveNetworkCount = async () => {
  const userId = Meteor.userId();
  return PrivatehiveOrderers.find({ active: true, deletedAt: null, userId }).count() + PrivatehivePeers.find({ active: true, deletedAt: null, userId }).count();
};

Meteor.methods({
  initializePrivateHiveNetwork: async ({ peerId, locationCode, type, name, voucherId }) => {
    const res = await PrivateHive.createPrivateHiveNetwork({ userId: Meteor.userId(), peerId, locationCode, type, name, voucherId });
    return res;
  },
  getPrivateHiveNetworkCount: PrivateHive.getPrivateHiveNetworkCount,
  deletePrivateHiveNetwork: async ({ instanceId }) => {
    return PrivateHive.deleteNetwork({ userId: Meteor.userId(), instanceId });
  },
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
        HTTP.call(
          'POST',
          `http://${Config.workerNodeIP(peerDetails.locationCode)}:${peerDetails.apiNodePort}/createChannel`,
          {
            data: {
              name: channelName,
              ordererURL: `${Config.workerNodeIP(ordererDetails.locationCode)}:${ordererDetails.ordererNodePort}`,
              ordererOrgName: ordererDetails.instanceId,
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

    await createChannel();

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
        HTTP.call('GET', `http://${newConfig.workerNodeIP(peerDetails.locationCode)}:${newPeerDetails.apiNodePort}/orgDetails`, {}, (error, response) => {
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
              ordererOrgName: ordererDetails.instanceId,
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
    PrivatehiveOrderers.find({
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
    }).fetch(),
    PrivatehivePeers.find({
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
    }).fetch(),
  ];

  result.networks = /* userNetworks */ []
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

export default PrivateHive;

//Note: At application layer we have to maintain a unique id for every network. Otherwise when inviting to channel we don't
//know which network to send invite to.
//When creating network or joining network, just create a peer node. Orderers will be added dynamically.

//Meteor.call('createPrivatehivePeer');
//Meteor.call('createPrivatehiveOrderer', 'cvmdruiu');
//Meteor.call('privatehiveCreateChannel', 'wosrhjfg', 'xgnwmbwk', 'channelsample');
//Meteor.call('privatehiveJoinChannel', 'muoygwak', 'moyxsmta', 'djtveuib', 'channelsample');
