import RazorPay from './payment-gateways/razorpay';
import Forex from '../../collections/payments/forex';
import PaymentRequests from '../../collections/payments/payment-requests';
import { RZSubscription, RZPlan } from '../../collections/razorpay';
const debug = require('debug')('api:payments')

const Payments = {};

Payments.createRequest = async ({ paymentGateway, reason, amount, mode, userId }) => {
  let insertResult;
  let subscription;
  const conversionFactor = await Payments.getConversionToINRRate({ currencyCode: 'usd' });
  if (mode === 'credit') {
    amount = 5;
    const rzPlan = RZPlan.find({ identifier: 'verification' }).fetch()[0];
    subscription = RZSubscription.find({
      userId: Meteor.userId(),
      plan_id: rzPlan.id,
    }).fetch()[0];
    if (!subscription) {
      subscription = await RazorPay.createSubscription({
        rzPlan,
        type: 'verification',
      });
    }
    insertResult = PaymentRequests.insert({
      userId: Meteor.userId(),
      paymentGateway,
      reason,
      amount: amount * 100,
      rzSubscriptionId: subscription._id,
      conversionFactor
    });
  } else if (mode === 'debit') {
    amount = conversionFactor;
    insertResult =  PaymentRequests.insert({
      userId: Meteor.userId(),
      paymentGateway,
      reason,
      amount: Math.round(amount * 100),
      conversionFactor
    });
    const returnValue = {paymentRequestId: insertResult, amount: Math.round(amount * 100), display_amount: 1, display_currency: 'USD' };
    debug('Payment create request | Debit RZP Options', returnValue);
    return returnValue;
  } else {
    const request = PaymentRequest.insert({
      userId: userId || Meteor.userId(),
      paymentGateway: 'razorpay',
      reason,
      amount: Math.round(amount * 100),
    });

    return {paymentRequestId: request};
  }


  const display_amount = Number(amount / conversionFactor).toFixed(2);

  const returnValue = { paymentRequestId: insertResult, rzSubscriptionId: subscription.id, amount: amount * 100, display_amount, display_currency: 'USD' };
  debug('Payment create request | Credit RZP Options', returnValue);
  return returnValue;
};

Payments.getConversionToINRRate = async ({ currencyCode }) => {
  currencyCode = currencyCode || 'usd';

  const exchangeRates = Forex.find({}).fetch()[0];
  debug('Get Conversion to INR | Forex ', exchangeRates);
  return Number(Number(exchangeRates[currencyCode.toLowerCase()]).toFixed(4));
};

Payments.refundAmount = async ({paymentRequestId, options}) => {
  const request = PaymentRequests.find({_id: paymentRequestId}).fetch()[0];
  if(!request) {
    throw new Meteor.Error('bad-request', 'Invalid request id');
  }
  const paymentId  = request.pgReference;
  if(!paymentId){
    throw new Meteor.Error('bad-request', 'Payment not yet initiated');
  }

  if(!options) {
    options = {};
  }
  if(!options.notes) {
    options.notes = {};
  }

  if(!options.notes.reason) {
    options.notes.reason = 'Refund for verification'
  }

  await RazorPay.refundPayment(paymentId, options);

  return true;
}

Meteor.methods({
  capturePaymentRazorPay: RazorPay.capturePayment,
  applyRZCardVerification: RazorPay.applyCardVerification,
  createPaymentRequest: Payments.createRequest,
  refundPayment: Payments.refundAmount
});

export default Payments;
