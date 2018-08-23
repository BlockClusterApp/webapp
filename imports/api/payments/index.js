import RazorPay from './payment-gateways/razorpay';
import PaymentRequests from '../../collections/payments/payment-requests';
import { RZSubscription, RZPlan } from '../../collections/razorpay';

const Payments = {};

Payments.createRequest = async ({paymentGateway, reason, amount}) => {
  const rzPlan = RZPlan.find({identifier: 'verification'}).fetch()[0];
  const rzSubscription = await RazorPay.createSubscription({
    rzPlan,
    type: 'verification'
  });
  const insertResult =  PaymentRequests.insert({
    userId: Meteor.userId(),
    paymentGateway,
    reason,
    amount,
    rzSubscriptionId: rzSubscription._id
  });
  return {paymentRequestId: insertResult, rzSubscriptionId: rzSubscription.id};
};

Meteor.methods({
    capturePaymentRazorPay: RazorPay.capturePayment,
    applyRZCardVerification: RazorPay.applyCardVerification,
    createPaymentRequest: Payments.createRequest
});
