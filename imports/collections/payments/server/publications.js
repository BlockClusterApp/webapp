import PaymentRequests from "../payment-requests"
import {RZPayment, RZPlan, RZSubscription } from '../../razorpay';
import UserCards from '../user-cards';
import Invoice from '../invoice';

Meteor.publish("userPayments", function () {
	return [PaymentRequests.find({userId: Meteor.userId()}, {
    fields: {
      pgReference: 0
    }
  }), RZPayment.find({
    userId: Meteor.userId()
  })];
});

Meteor.publish("userCards", function() {
  return UserCards.find({userId: Meteor.userId()});
});

Meteor.publish("pending-invoice", function (billingLabel) {
  return Invoice.find({
    userId: Meteor.userId(),
    billingPeriodLabel: billingLabel,
    paymentStatus: 1
  });
});

Meteor.publish("rzp-subscription", function () {
  const rzPlan = RZPlan.find({ identifier: 'verification' }).fetch()[0];
  return [RZSubscription.find({
    userId: Meteor.userId(),
    plan_id: rzPlan.id,
  })];
});

Meteor.publish("invoice.admin.id", (id) => {
  return Invoice.find({_id: id})
});
