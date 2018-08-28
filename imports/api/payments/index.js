import RazorPay from './payment-gateways/razorpay';
import Forex from '../../collections/payments/forex';
import PaymentRequests from '../../collections/payments/payment-requests';
import { RZSubscription, RZPlan } from '../../collections/razorpay';

const Payments = {};

Payments.createRequest = async ({ paymentGateway, reason, amount }) => {
  const rzPlan = RZPlan.find({ identifier: 'verification' }).fetch()[0];
  let subscription = RZSubscription.find({
    userId: Meteor.userId(),
    plan_id: rzPlan.id,
  }).fetch()[0];
  if (!subscription) {
    subscription = await RazorPay.createSubscription({
      rzPlan,
      type: 'verification',
    });
  }
  const insertResult = PaymentRequests.insert({
    userId: Meteor.userId(),
    paymentGateway,
    reason,
    amount,
    rzSubscriptionId: subscription._id,
  });
  return { paymentRequestId: insertResult, rzSubscriptionId: subscription.id };
};

Payments.getConversionToINRRate = async ({ currencyCode }) => {
  currencyCode = currencyCode || 'usd';

  const exchangeRates = Forex.find({}).fetch()[0];
  return Number(Number(exchangeRates[currencyCode.toLowerCase()]).toFixed(4));
};

Meteor.methods({
  capturePaymentRazorPay: RazorPay.capturePayment,
  applyRZCardVerification: RazorPay.applyCardVerification,
  createPaymentRequest: Payments.createRequest,
});

export default Payments;
