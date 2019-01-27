import { Networks } from '../../collections/networks/networks';
import UserCards from '../../collections/payments/user-cards';
import { UserInvitation } from '../../collections/user-invitation';
import PaymentRequests from '../../collections/payments/payment-requests';
import Voucher from '../../collections/vouchers/voucher';
import Billing from '../billing';
import Bluebird from 'bluebird';

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

  return true;
};

Meteor.methods({
  fetchAdminDashboardDetails: User.fetchAdminDashboardDetails,
  updateUserAdmin: User.updateAdmin,
  adminVerifyEmail: User.verifyEmail,
  adminDeleteCard: User.removeCard,
});

export default User;
