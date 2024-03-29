import Bluebird from 'bluebird';

import { Networks } from '../../collections/networks/networks';
import { Hyperion } from '../../collections/hyperion/hyperion';
import { Paymeter } from '../../collections/paymeter/paymeter';

import Config from '../../modules/config/server';
import Bull from '../../modules/schedulers/bull';

import moment from 'moment';

const User = {};
const mobileNumberRegex = /^\+{0,2}([\-\. ])?(\(?\d{0,3}\))?([\-\. ])?\(?\d{0,3}\)?([\-\. ])?\d{3}([\-\. ])?\d{4}/;

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

User.preventDelete = async function({ userId }) {
  const _user = Meteor.user();
  if (_user && _user.admin < 2) {
    throw new Meteor.Error(401, 'Unauthorized');
  }
  const user = Meteor.users.find({ _id: userId }).fetch()[0];
  const updateObject = {};
  if (user.preventDelete) {
    updateObject.$unset = {
      preventDelete: '',
    };
  } else {
    updateObject.$set = {
      preventDelete: true,
    };
  }
  Meteor.users.update({ _id: userId }, updateObject);

  return true;
};

User.areFunctionsDisabled = async function({ userId }) {
  const user = Meteor.users.find({ _id: userId }).fetch()[0];
  if (!user) {
    return false;
  }
  return !!user.paymentPending;
};

User.disableFunctions = async function({ userId }) {
  const user = Meteor.user();
  if (user && user.admin < 2) {
    throw new Meteor.Error(401, 'Unauthorized');
  }
  if (user) await deleteDynamoIngresses({ userId });
  // TODO: Send email for this

  if (user) {
    const updateObject = {
      $set: {
        paymentPending: true,
      },
    };
    updateObject.$push = {
      metastatus: {
        status: 'disable-functions',
        from: `admin-${user.emails[0].address}`,
        on: new Date(),
        by: user._od,
      },
    };
    Meteor.users.update({ _id: userId }, updateObject);
  }
  return true;
};

User.enableFunctions = async function({ userId }) {
  const user = Meteor.user();
  if (user && user.admin < 2) {
    throw new Meteor.Error(401, 'Unauthorized');
  }
  await enableDynamoIngresses({ userId });
  // TODO: send email for alerting about this

  const updateObject = {
    $unset: {
      paymentPending: '',
    },
    $push: {},
  };
  if (!user) {
    updateObject.$push = {
      metastatus: {
        status: 'enable-functions',
        from: 'bill-payment',
        on: new Date(),
      },
    };
    updateObject.$unset = { ...updateObject.$unset, paymentPendingForInvoiceId: '', paymentPendingOn: '' };
  } else {
    updateObject.$push = {
      metastatus: {
        status: 'enable-functions',
        from: `admin-${user.emails[0].address}`,
        on: new Date(),
        by: user._id,
      },
    };
  }
  Meteor.users.update(
    {
      _id: userId,
    },
    updateObject
  );

  return true;
};

User.deleteAllUserData = async function({ userId }) {
  if (moment().get('date') < 25) {
    throw new Meteor.Error(400, 'Cannot delete user data before 25th of this month');
  }

  await Bluebird.all([deleteNetworks({ userId }), deleteHyperion({ userId }), deletePaymeter({ userId })]);

  return true;
};

User.updateInfo = async ({ firstName, lastName, mobile }) => {
  const user = Meteor.user();

  const update = {};
  if (mobile && !mobileNumberRegex.test(mobile)) {
    throw new Meteor.Error(400, 'Invalid mobile number');
  }
  if (user.profile.mobiles && user.profile.mobiles[0].number !== mobile) {
    update['profile.mobiles'] = [
      {
        number: mobile,
        verified: false,
        from: 'user-dashboard',
      },
    ];
  }

  Meteor.users.update(
    {
      _id: Meteor.userId(),
    },
    {
      $set: {
        'profile.firstName': firstName,
        'profile.lastName': lastName,
        ...update,
      },
    }
  );

  return true;
};

Meteor.methods({
  disableUser: User.disableFunctions,
  enableUser: User.enableFunctions,
  preventDelete: User.preventDelete,
  updateProfile: User.updateInfo,
});

export default User;
