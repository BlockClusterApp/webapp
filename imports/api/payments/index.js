import RazorPay from './payment-gateways/razorpay';
import Forex from '../../collections/payments/forex';
import Invoice from '../../collections/payments/invoice';
import InvoiceFunctions from '../../api/billing/invoice';
import PaymentRequests from '../../collections/payments/payment-requests';
import { RZSubscription, RZPlan, RZPaymentLink } from '../../collections/razorpay';
import Stripe from './payment-gateways/stripe';
const debug = require('debug')('api:payments');

const Payments = {};

Payments.createRequest = async ({ paymentGateway, reason, amount, amountInPaisa, mode, userId, metadata, display_amount, display_currency }) => {
  let insertResult;
  let subscription;
  paymentGateway = paymentGateway || 'razorpay';
  const conversionFactor = await Payments.getConversionToINRRate({ currencyCode: 'usd' });
  if (mode === 'credit') {
    amount = 5;
    const rzPlan = RZPlan.find({ identifier: 'verification' }).fetch()[0];
    subscription = RZSubscription.find({
      userId: Meteor.userId(),
      plan_id: rzPlan.id,
      bc_status: 'active',
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
      conversionFactor,
    });
  } else if (mode === 'debit') {
    amount = conversionFactor;
    insertResult = PaymentRequests.insert({
      userId: Meteor.userId(),
      paymentGateway,
      reason,
      amount: Math.round(amount * 100),
      conversionFactor,
    });
    const returnValue = { paymentRequestId: insertResult, amount: Math.round(amount * 100), display_amount: 1, display_currency: 'USD' };
    debug('Payment create request | Debit RZP Options', returnValue);
    return returnValue;
  } else {
    const request = PaymentRequests.insert({
      userId: userId || Meteor.userId(),
      paymentGateway: 'razorpay',
      reason,
      metadata,
      amount: amountInPaisa || Math.round(amount * 100),
      conversionFactor: metadata.conversionFactor,
    });

    return { paymentRequestId: request, amount: amountInPaisa || Math.round(amount * 100), display_amount, display_currency: 'USD', conversionFactor };
  }

  display_amount = Number(amount / conversionFactor).toFixed(2);

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

Payments.refundAmount = async ({ paymentRequestId, options }) => {
  ElasticLogger.log('Refund', { paymentRequestId, options, user: Meteor.userId() });
  const request = PaymentRequests.find({ _id: paymentRequestId }).fetch()[0];
  if (!request) {
    throw new Meteor.Error('bad-request', 'Invalid request id');
  }
  const paymentId = request.pgReference;
  if (!paymentId) {
    throw new Meteor.Error('bad-request', 'Payment not yet initiated');
  }

  if (!options) {
    options = {};
  }
  if (!options.notes) {
    options.notes = {};
  }

  if (!options.notes.reason) {
    options.notes.reason = 'Refund for verification';
  }

  await RazorPay.refundPayment(paymentId, options);

  return true;
};

Payments.createRequestForInvoice = async ({ invoiceId, userId }) => {
  const invoice = Invoice.find({
    userId: userId || Meteor.userId(),
    _id: invoiceId,
  }).fetch()[0];

  if (!invoice) {
    RavenLogger.log(`Creating payment request for invoice without valid invoice`, { invoiceId, userId: userId || Meteor.userId() });
    throw new Meteor.Error('bad-request', 'Invalid invoice');
  }

  const rzPlan = RZPlan.find({ identifier: 'verification' }).fetch()[0];
  const subscription = RZSubscription.find({
    userId: userId || Meteor.userId(),
    bc_status: 'active',
    plan_id: rzPlan.id,
  }).fetch()[0];

  if (subscription) {
    RavenLogger.log(`Creating Request for Invoice with Subscription`, { invoiceId, userId: invoice.userId, subscription: subscription._id });
    throw new Meteor.Error(`bad-request`, 'Already have subscription enabled. Money will be auto debited');
  }

  const amount = Number(Number(invoice.totalAmount) * Number(invoice.conversionRate));
  return Payments.createRequest({
    reason: `Bill payment for ${invoice.billingPeriodLabel}`,
    amount,
    display_currency: 'USD',
    display_amount: Number(invoice.totalAmount).toFixed(2),
    userId: userId || Meteor.userId(),
    metadata: {
      invoiceId,
      conversionFactor: invoice.conversionFactor,
    },
  });
};

Payments.captureInvoicePayment = async pgResponse => {
  const rzPayment = await RazorPay.capturePayment(pgResponse);

  const paymentRequest = PaymentRequests.find({
    _id: rzPayment.notes.paymentRequestId,
  }).fetch()[0];

  if (!paymentRequest) {
    RavenLogger.log(`Capturing Invoice payment without payment request`, { pgResponse });
    throw new Meteor.Error('bad-request', 'Invalid payment request to capture');
  }
  const invoice = Invoice.find({
    _id: paymentRequest.metadata.invoiceId,
  }).fetch()[0];

  console.log('Setting invoice');

  const settleResult = await InvoiceFunctions.settleInvoice({
    billingMonthLabel: invoice.billingPeriodLabel,
    invoiceId: invoice._id,
    rzPayment,
  });

  debug('Capture Invoice Payment | Settle Result', settleResult);

  return true;
};

Payments.createPaymentLink = async ({ reason, amount, amountInPaisa, amountInUSD, userId, invoiceId }) => {
  if (Meteor.user().admin < 2) {
    throw new Meteor.Error('unauthorized', 'Unauthorized to perform this');
  }

  let user;

  if (invoiceId) {
    const invoice = Invoice.find({ id: _id }).fetch()[0];
    if (invoice.paymentLink && invoice.paymentLink.link && !invoice.paymentLink.expired) {
      return invoice.paymentLink;
    }
    amountInPaisa = invoice.totalAmountINR;
    reason = reason || `Bill for ${invoice.billingPeriodLabel}`;
    user = Meteor.users.find({ _id: invoice.userId }).fetch()[0];
  }

  if (!(reason && reason.length > 10)) {
    throw new Meteor.Error('bad-request', 'Cannot create payment link without a valid reason. This reason would be sent in mail. Minimum of 10 characters needed');
  }

  if (!amountInPaisa && amountInUSD) {
    const conversionFactor = await Payments.getConversionToINRRate({ currencyCode: 'usd' });
    amount = amountInUSD * conversionFactor;
    amountInPaisa = Math.round(amount * 100);
  }

  if (!user) {
    user = Meteor.users
      .find({
        _id: userId,
      })
      .fetch()[0];
  }

  const paymentLinkId = await RazorPay.createPaymentLink({ amount: amountInPaisa, user, description: reason });

  return RZPaymentLink.find({
    _id: paymentLinkId,
  }).fetch()[0];
};

Payments.createStripeCustomer = async ({ token }) => {
  const userId = Meteor.userId();

  return Stripe.createCustomer({ userId, token });
};

Meteor.methods({
  createPaymentRequest: Payments.createRequest,
  refundPayment: Payments.refundAmount,
  createRequestForInvoice: Payments.createRequestForInvoice,
  captureInvoicePayment: Payments.captureInvoicePayment,
  createPaymentLink: Payments.createPaymentLink,
  captureStripeCustomer: Payments.createStripeCustomer,
});

export default Payments;
