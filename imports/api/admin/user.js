import { Networks } from '../../collections/networks/networks';
import UserCards from '../../collections/payments/user-cards';
import { UserInvitation } from '../../collections/user-invitation';
import PaymentRequests from '../../collections/payments/payment-requests';
import Voucher from '../../collections/vouchers/voucher';
import Billing from '../billing';
import Bluebird from 'bluebird';
import Bull from '../../modules/schedulers/bull';
import { RZSubscription } from '../../collections/razorpay';
import RazorPay from '../payments/payment-gateways/razorpay';

const User = {};
const ADMIN_LEVEL = 0;

User.fetchAdminDashboardDetails = async userId => {
  if (Meteor.user().admin <= ADMIN_LEVEL) {
    return reject(new Meteor.Error('Unauthorized'));
  }
  const result = await Bluebird.props({
    details: Meteor.users.find({ _id: userId }, { fields: { services: 0 } }).fetch()[0],
    bill: Billing.generateBill({ userId, isFromFrontend: true }),
  });

  return result;
};

User.updateAdmin = async (userId, updateQuery) => {
  if ((Meteor.userId() === userId && updateQuery.admin !== undefined) || Meteor.user().admin <= ADMIN_LEVEL) {
    return false;
  }
  const update = {};
  if (updateQuery.admin !== undefined) {
    update.admin = updateQuery.admin;
  }
  if (updateQuery.demo !== undefined) {
    update.demoUser = updateQuery.demo;
  }
  if (updateQuery.offlineUser !== undefined) {
    update.offlineUser = updateQuery.offlineUser;
  }
  ElasticLogger.log('Updating admin', { userId, updateQuery });
  Meteor.users.update(
    {
      _id: userId,
    },
    {
      $set: update,
    }
  );
  return true;
};

User.verifyEmail = async ({ userId, email, verified }) => {
  if ((Meteor.userId() === userId && updateQuery.admin !== undefined) || Meteor.user().admin <= ADMIN_LEVEL) {
    return false;
  }
  const result = Meteor.users.update(
    {
      _id: userId,
      'emails.address': email,
    },
    {
      $set: {
        'emails.$.verified': verified,
      },
    }
  );
  return true;
};

User.generateBill = async ({ userId }) => {
  if (Meteor.user().admin <= ADMIN_LEVEL) {
    return reject(new Meteor.Error('Unauthorized'));
  }
  ElasticLogger.log('Manual bill triggered', {
    for: userId,
    by: Meteor.userId(),
    at: new Date(),
  });
  Bull.addJob(
    'generate-bill-user',
    {
      userId,
    },
    {
      attempts: 5,
    }
  );
};

User.removeCard = async ({ cardId, userId }) => {
  if (Meteor.user().admin <= ADMIN_LEVEL) {
    return reject(new Meteor.Error('Unauthorized'));
  }

  ElasticLogger.log('Admin remove card', {
    userId,
    cardId,
    by: Meteor.user()._id,
  });

  UserCards.update(
    {
      userId,
      'cards.id': cardId,
      active: {
        $nin: [false],
      },
    },
    {
      $set: {
        'cards.$.active': false,
      },
    }
  );

  const rzSubscription = RZSubscription.find({ userId }).fetch();
  if (rzSubscription) {
    await RazorPay.cancelSubscription({ rzSubscription });
    RZSubscription.update(
      {
        _id: rzSubscription._id,
      },
      {
        $set: {
          bc_status: 'cancelled',
        },
      }
    );
  }

  return true;
};

User.changeTheme = async ({ theme }) => {
  Meteor.users.update(
    {
      _id: Meteor.userId(),
    },
    {
      $set: {
        'profile.theme': theme,
      },
    }
  );

  return true;
};

Meteor.methods({
  fetchAdminDashboardDetails: User.fetchAdminDashboardDetails,
  updateUserAdmin: User.updateAdmin,
  adminVerifyEmail: User.verifyEmail,
  adminDeleteCard: User.removeCard,
  adminGenerateBill: User.generateBill,
  changeTheme: User.changeTheme,
});

export default User;
