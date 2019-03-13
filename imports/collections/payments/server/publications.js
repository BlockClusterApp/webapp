import PaymentRequests from '../payment-requests';
import StripePayments from '../../stripe/payments';
import { RZPayment, RZPlan, RZSubscription } from '../../razorpay';
import UserCards from '../user-cards';
import Invoice from '../invoice';
import Credits from '../credits';

const pageSize = 10;
const MIN_ADMIN_LEVEL = 1;
Meteor.publish('userPayments', function() {
  return [
    PaymentRequests.find(
      { userId: Meteor.userId() },
      {
        fields: {
          pgReference: 0,
        },
      }
    ),
    RZPayment.find({
      userId: Meteor.userId(),
    }),
    StripePayments.find({
      userId: Meteor.userId(),
    }),
  ];
});

Meteor.publish('userCards', function() {
  return UserCards.find({ userId: Meteor.userId() });
});

Meteor.publish('paymentRequest.stripe', function({ id }) {
  return PaymentRequests.find({
    _id: id,
    userId: Meteor.userId(),
  });
});

Meteor.publish('pending-invoice', function(billingLabel) {
  return Invoice.find({
    userId: Meteor.userId(),
    billingPeriodLabel: billingLabel,
    paymentStatus: {
      $in: [Invoice.PaymentStatusMapping.Pending, Invoice.PaymentStatusMapping.Failed],
    },
  });
});

Meteor.publish('rzp-subscription', function() {
  const rzPlan = RZPlan.find({ identifier: 'verification' }).fetch()[0];
  return [
    RZSubscription.find({
      userId: Meteor.userId(),
      plan_id: rzPlan.id,
    }),
  ];
});

Meteor.publish('invoice.admin.id', id => {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return Invoice.find({ _id: id });
});

Meteor.publish('invoice.all', function({ page }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return Invoice.find(
    {},
    {
      limit: pageSize,
      skip: page * pageSize,
      fields: {
        items: 0,
      },
    }
  );
});

Meteor.publish('invoice.search', function({ query, limit, page }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  limit = limit || pageSize;
  page = page || 1;
  return Invoice.find(query, {
    limit: pageSize,
    skip: (page - 1) * pageSize,
    fields: {
      items: 0,
    },
  });
});

Meteor.publish('credits.all', () => {
  return Credits.find({
    userId: Meteor.userId(),
  });
});
