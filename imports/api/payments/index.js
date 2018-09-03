import RazorPay from './payment-gateways/razorpay';
import Forex from '../../collections/payments/forex';
import PaymentRequests from '../../collections/payments/payment-requests';
import { RZSubscription, RZPlan } from '../../collections/razorpay';
const debug = require('debug')('api:payments')

const Payments = {};

Payments.createRequest = async ({ paymentGateway, reason, amount, mode }) => {
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

Meteor.methods({
  capturePaymentRazorPay: RazorPay.capturePayment,
  applyRZCardVerification: RazorPay.applyCardVerification,
  createPaymentRequest: Payments.createRequest,
});

export default Payments;
