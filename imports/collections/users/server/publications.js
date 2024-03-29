import { Networks } from '../../../collections/networks/networks';
import UserCards from '../../../collections/payments/user-cards';
import { UserInvitation } from '../../../collections/user-invitation';
import PaymentRequests from '../../../collections/payments/payment-requests';
import Invoice from '../../../collections/payments/invoice';
import Voucher from '../../../collections/vouchers/voucher';
import { RZPaymentLink } from '../../../collections/razorpay';
import Credits from '../../../collections/payments/credits';
import { Hyperion } from '../../../collections/hyperion/hyperion';
import { Paymeter } from '../../../collections/paymeter/paymeter';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';
import { PrivatehiveOrderers } from '../../../collections/privatehiveOrderers/privatehiveOrderers';

Meteor.publish(null, function() {
  return Meteor.users.find(this.userId, { fields: { emails: 1, profile: 1, admin: 1, _id: 1, demoUser: 1, paymentPending: 1, offlineUser: 1 } });
});
const MIN_ADMIN_LEVEL = 0;
const pageSize = 10;
Meteor.publish('users.all', function({ page }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  page = page || 1;
  return Meteor.users.find(
    {},
    {
      limit: pageSize * page,
      sort: {
        createdAt: -1,
      },
      fields: {
        emails: 1,
        profile: 1,
        admin: 1,
        demoUser: 1,
        offlineUser: 1,
        _id: 1,
        createdAt: 1,
        paymentPending: 1,
      },
    }
  );
});

Meteor.publish('users.search', function({ query, limit, page }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  limit = limit || pageSize;
  page = page || 1;
  skip = (page - 1) * pageSize;
  limit = limit * page;
  return Meteor.users.find(
    query,
    {
      sort: {
        createdAt: -1,
      },
      limit: limit,
      skip,
    },
    {
      fields: {
        services: 0,
      },
    }
  );
});

Meteor.publish('users.details', function({ userId }) {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return [Meteor.users.find({ _id: userId }, { fields: { services: 0 } })];
});

Meteor.publish('user.details.networks', ({ userId }) => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return Networks.find({ user: userId });
});
Meteor.publish('user.details.oldNetworks', ({ userId }) => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return Networks.find({ user: userId, deletedAt: { $ne: null } });
});

Meteor.publish('user.details.userInvitations', ({ userId }) => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return UserInvitation.find({ inviteFrom: userId });
});

Meteor.publish('user.details.userCards', ({ userId }) => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return UserCards.find({ userId });
});

Meteor.publish('user.details.payments', ({ userId }) => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return PaymentRequests.find({ userId });
});

Meteor.publish('user.details.vouchers', ({ userId }) => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return Voucher.find({ claimedBy: userId });
});

Meteor.publish('user.details.credits', ({ userId }) => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return Credits.find({
    userId,
  });
});

Meteor.publish('user.details.hyperionStats', ({ userId }) => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return Hyperion.find({
    userId,
  });
});

Meteor.publish('user.details.paymeterStats', ({ userId }) => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return Paymeter.find({
    userId,
  });
});

Meteor.publish('user.details.privatehive', ({ userId }) => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return [PrivatehivePeers.find({ userId }), PrivatehiveOrderers.find({ userId })];
});

Meteor.publish('user.details.invoices', ({ userId }) => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return Invoice.find(
    { userId },
    {
      fields: {
        items: 0,
        networks: 0,
      },
    }
  );
});

Meteor.publish('user.details.paymentLinks', ({ userId }) => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return RZPaymentLink.find({ userId });
});
