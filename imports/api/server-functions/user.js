import Bluebird from 'bluebird';

import { Networks } from '../../collections/networks/networks';
import { Hyperion } from '../../collections/hyperion/hyperion';
import { Paymeter } from '../../collections/paymeter/paymeter';

import Config from '../../modules/config/server';
import Bull from '../../modules/schedulers/bull';

import moment from 'moment';

const User = {};

function _deleteNetwork(id, userId) {
  return new Promise(resolve => {
    Meteor.call('deleteNetwork', network._id, userId, (err, res) => {
      ElasticLogger.log('Deleting network for user due to non payment', {
        userId,
        networkId: id,
        err,
        res,
      });
      resolve();
    });
  });
}

async function deleteNetworks({ userId }) {
  const networks = Networks.find({ user: userId }, { fields: { _id: 1 } }).fetch();

  const promises = [];
  networks.forEach(network => {
    promises.push(_deleteNetwork(network._id, userId));
  });

  try {
    await Bluebird.all(promises);
  } catch (err) {
    console.log('Error deleting networks', err);
    return false;
  }

  return true;
}

async function deleteHyperion({ userId }) {
  Hyperion.update(
    {
      userId,
    },
    {
      deleted: true,
      deletedOn: new Date(),
    }
  );
  // TODO: Delete hyperion files

  return true;
}

async function deletePaymeter({ userId }) {
  Paymeter.update(
    {
      userId,
    },
    {
      deleted: true,
      deletedOn: new Data(),
    }
  );
  // TODO: Delete all paymeter wallets
  return true;
}

async function enableDynamoIngresses({ userId }) {
  Bull.addJob('enable-ingress', {
    userId,
  });
  return true;
}

async function deleteDynamoIngresses({ userId }) {
  const networks = Networks.find({ user: userId, deletedAt: null }).fetch();
  networks.forEach(network => {
    Bull.addJob('disable-ingress', {
      instanceId: network.instanceId,
      locationCode: network.locationCode,
      userId,
      namespace: Config.namespace,
    });
  });

  return true;
}

User.areFunctionsDisabled = async function({ userId }) {
  const user = Meteor.users.find({ _id: userId }).fetch()[0];
  if (!user) {
    return false;
  }
  return !!user.paymentPending;
};

User.disableFunctions = async function({ userId }) {
  await deleteDynamoIngresses({ userId });
  // TODO: Send email for this
  return true;
};

User.enableFunctions = async function({ userId }) {
  await enableDynamoIngresses({ userId });
  // TODO: send email for alerting about this
  return true;
};

User.deleteAllUserData = async function({ userId }) {
  if (moment().get('date') < 25) {
    throw new Meteor.Error(400, 'Cannot delete user data before 25th of this month');
  }

  await Bluebird.all([deleteNetworks({ userId }), deleteHyperion({ userId }), deletePaymeter({ userId })]);

  return true;
};

export default User;
