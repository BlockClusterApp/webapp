import razorpay from 'razorpay';
import Config from '../../../modules/config/server';
import UserCards from '../../../collections/payments/user-cards';
import PaymentRequests from '../../../collections/payments/payment-requests';
import request from 'request';
import { RZPlan, RZSubscription, RZAddOn, RZPaymentLink } from '../../../collections/razorpay';
import moment from 'moment';
import crypto from 'crypto';
import Bull from '../../../modules/schedulers/bull';
import Payments from '../';
import bullSystem from '../../../modules/schedulers/bull';
import Invoice from '../../../collections/payments/invoice';
import Forex from '../../../collections/payments/forex';

const debug = require('debug')('api:razorpay');

const RazorPayInstance = new razorpay({
  key_id: Config.RazorPay.id,
  key_secret: Config.RazorPay.secret,
});

const RazorPay = {};

const RZ_URL = `https://${Config.RazorPay.id}:${Config.RazorPay.secret}@api.razorpay.com`;

function getStartDate() {
  return moment()
    .add(1, 'month')
    .startOf('month')
    .add(4, 'days')
    .add(5, 'hour');
}

RazorPay.validateSubscriptionSignature = ({ razorpay_payment_id, razorpay_subscription_id, razorpay_signature }) => {
  const generatedSignature = crypto
    .createHmac('sha256', Config.RazorPay.secret)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest('hex');
  return generatedSignature === razorpay_signature;
};

/* Flow:
Plan:
1. The plan will be 'verification' which will always have an amount of Rs 1
2. No other plans will be there. Any extra charge will be an addon

Subscription:
1. Create a subscription for user with start date as 5th of next month
2. On 1st of every month, calculate the bill for the previous month for the user
3. Add the above amount as an addon charge to the subscription.
4. Due to some error if something fails, we have 4 days buffer.
*/
RazorPay.createPlan = async ({ plan, identifier }) => {
  let rzPlan = RZPlan.find({ identifier }).count();
  if (rzPlan > 0) {
    RavenLogger.log('RazorPay.createPlan: Plan already exists', { plan, identifier });
    throw new Meteor.Error('bad-request', 'RZPlan identifier already exists ');
  }
  try {
    rzPlan = await RazorPayInstance.plans.create(plan);
    debug('CreatePlan | RzPlan Response', rzPlan);
  } catch (err) {
    RavenLogger.log(err);
    debug('CreatePlan | error razorpay', err);
    return false;
  }

  const rzPlanId = RZPlan.insert({ ...rzPlan, identifier });
  return RZPlan.find({ _id: rzPlanId }).fetch()[0];
};

RazorPay.deletePlan = async ({ identifier }) => {
  ElasticLogger.log('RZPlan delete', { identifier, userId: Meteor.userId() });
  const rzPlan = RZPlan.find({ identifier }).fetch()[0];
  if (!rzPlan) {
    RavenLogger.log('RazorPay.deletePlan: Plan does not exists', { identifier });
    throw new Meteor.Error('bad-request', `Invalid RZPlan identifier ${identifier}`);
  }
  RZPlan.update(
    {
      identifier,
    },
    {
      $set: {
        active: false,
      },
    }
  );

  return true;
};

RazorPay.fetchInvoices = async ({ paymentId, customerId }) => {
  const query = {
    payment_id: paymentId,
    customer_id: customerId,
  };
  try {
    const rzInvoice = await RazorPayInstance.invoices.all(query);
    debug('Fetch Invoice | response', rzInvoice);
    if (rzInvoice.items) {
      return rzInvoice.items[0];
    }
    return undefined;
  } catch (err) {
    RavenLogger.log(err);
    debug('Fetch Invoices | err razorpay', err);
    return false;
  }
};

RazorPay.createSubscription = async ({ rzPlan, type }) => {
  type = type || 'Node Monthly';
  let rzSubscription;
  try {
    rzSubscription = await RazorPayInstance.subscriptions.create({
      plan_id: rzPlan.id,
      customer_notify: 0,
      total_count: 12 * 10,
      start_at: Math.floor(
        getStartDate()
          .toDate()
          .getTime() / 1000
      ),
    });
    debug('CreateSubscription | RzSubscription Response', rzPlan);
  } catch (err) {
    RavenLogger.log(err);
    debug('CreateSubscription | error razorpay', err);
    return false;
  }
  const rzSubscriptionId = RZSubscription.insert({
    ...rzSubscription,
    userId: Meteor.userId(),
    type: type,
    bc_status: 'pending',
  });
  return RZSubscription.find({ _id: rzSubscriptionId }).fetch()[0];
};

RazorPay.cancelSubscription = async ({ rzSubscription }) => {
  // Cancels the subscription at the end of cycle so that the we can attach addons before the 5th of next month.
  try {
    const cancelResponse = await RazorPayInstance.subscriptions.cancel(rzSubscription.id, true);
    debug('Cancel Subscription | Response', cancelResponse);
    ElasticLogger.log('RZSubscription cancel', {
      rzSubscription: rzSubscription._id,
      userId: Meteor.userId(),
    });
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
    return cancelResponse;
  } catch (err) {
    RavenLogger.log(err);
    debug('Cancel Subscription | Error', err);
  }

  return false;
};

RazorPay.createAddOn = async ({ subscriptionId, addOn, userId }) => {
  debug('Creating addon', addOn, subscriptionId);
  try {
    const addOnResponse = await RazorPayInstance.subscriptions.createAddon(subscriptionId, {
      item: {
        name: addOn.name,
        description: addOn.description,
        amount: addOn.amount,
        currency: addOn.currency || 'INR',
      },
      quantity: addOn.quantity || 1,
    });
    debug('Create AddOn | Response', addOnResponse);
    const addOnId = RZAddOn.insert({ ...addOnResponse, userId, subscriptionId });
    return RZAddOn.find({ _id: addOnId }).fetch()[0];
  } catch (err) {
    RavenLogger.log(err);
    debug('Create AddOn | Error', err);
    return false;
  }
  return false;
};

RazorPay.capturePayment = async paymentResponse => {
  let rzpayment = { notes: {} };
  debug('Razorpay response', paymentResponse);
  try {
    // First update payment status
    rzpayment = await RazorPayInstance.payments.fetch(paymentResponse.razorpay_payment_id);
    debug('Razorpay payment', rzpayment);
    if (!rzpayment) {
      throw new Error('Invalid razorpay payment id');
    }
    if (rzpayment.status === 'refunded') {
      PaymentRequests.update(
        {
          _id: rzpayment.notes.paymentRequestId,
        },
        {
          $set: {
            paymentStatus: PaymentRequests.StatusMapping.Refunded,
            pgReference: paymentResponse.razorpay_payment_id,
          },
          $push: {
            pgResponse: rzpayment,
          },
        }
      );
      console.log(`Payment ${paymentResponse.razorpay_payment_id} already ${rzpayment.status}. Can't refund it again`);
      return false;
    }
    if (rzpayment.status === 'captured') {
      console.log(`Payment ${paymentResponse.razorpay_payment_id} already ${rzpayment.status}. Can't capture it again`);
      return rzpayment;
    }
    const paymentRequest = PaymentRequests.find({
      _id: rzpayment.notes.paymentRequestId,
    }).fetch()[0];

    if (!paymentRequest) {
      RavenLogger.log('RazorPay.capturePayment: Invalid payment request id for rzpayment', paymentResponse);
      throw new Error('Invalid payment request id for rzpayment ', paymentResponse);
    }

    PaymentRequests.update(
      {
        _id: rzpayment.notes.paymentRequestId,
      },
      {
        $set: {
          paymentStatus: PaymentRequests.StatusMapping.Approved,
          pgReference: paymentResponse.razorpay_payment_id,
        },
        $push: {
          pgResponse: rzpayment,
        },
      }
    );
    const amount = paymentRequest.amount || 100;
    const captureResponse = await RazorPayInstance.payments.capture(paymentResponse.razorpay_payment_id, amount);
    debug('Capture response ', captureResponse);

    PaymentRequests.update(
      {
        _id: rzpayment.notes.paymentRequestId,
      },
      {
        $push: {
          pgResponse: captureResponse,
        },
      }
    );

    return rzpayment;
  } catch (err) {
    // rollback
    RavenLogger.log(err);
    debug('Error capturing', err);
    PaymentRequests.update(
      {
        _id: rzpayment.notes.paymentRequestId,
      },
      {
        $set: {
          paymentStatus: PaymentRequests.StatusMapping.Pending,
        },
      }
    );
  }

  return true;
};

/**
 *
 * @param {string} paymentId
 * @param {object} options
 * @property {number} options.amount
 * @property {object} options.notes
 */
RazorPay.refundPayment = async (paymentId, options = {}) => {
  const paymentRequest = PaymentRequests.find({
    pgReference: paymentId,
    'pgResponse.status': 'captured',
  }).fetch()[0];

  if (!paymentRequest && !options.noPaymentRequest) {
    throw new Error(`Invalid payment Id ${paymentId}`);
  }

  delete options.noPaymentRequest;

  if (!options.amount) {
    options.amount = paymentRequest.amount;
  }
  if (!options.amount) {
    throw new Error('Amount not specified for refund');
  }

  options.notes = options.notes || {};
  options.notes.reason = options.notes.reason || 'Refund from backend';

  try {
    const refundResponse = await RazorPayInstance.payments.refund(paymentId, options);
    debug('refund response ', refundResponse);

    const updateResult = PaymentRequests.update(
      {
        pgReference: paymentId,
      },
      {
        $set: {
          paymentStatus: PaymentRequests.StatusMapping.Refunded,
          refundedAt: new Date(),
        },
        $push: {
          pgResponse: refundResponse,
        },
      }
    );

    debug('Refund updated', updateResult);

    return updateResult;
  } catch (err) {
    RavenLogger.log(err);
    debug('Refund error', err);
    // rollback
  }
};

RazorPay.fetchCard = paymentId => {
  return new Promise((resolve, reject) => {
    request.get(`${RZ_URL}/v1/payments/${paymentId}/card`, (err, res, body) => {
      if (err) {
        RavenLogger.log(err);
        return reject(err);
      }
      resolve(JSON.parse(body));
    });
  });
};

RazorPay.processSubscriptionPayment = async pgResponse => {
  const { razorpay_subscription_id } = pgResponse;
  const isPaymentVerified = RazorPay.validateSubscriptionSignature(pgResponse);
  if (!isPaymentVerified) {
    return new Meteor.Error('bad-request', 'Payment not verified');
  }
  try {
    const subscription = await RazorPayInstance.subscriptions.fetch(razorpay_subscription_id);
    RZSubscription.update(
      {
        id: razorpay_subscription_id,
      },
      {
        $set: {
          bc_status: 'active',
          status: subscription.status,
        },
      }
    );
    debug('Process Subscription | Success', subscription);
    return true;
  } catch (err) {
    RavenLogger.log(err);
    debug('Process Subscription Payment', err);
    return false;
  }
};

RazorPay.applyCardVerification = async pgResponse => {
  // {razorpay_payment_id: "pay_Aot9VLoxXYOzZm", razorpay_subscription_id: "sub_Aot895RMBkVZYF", razorpay_signature: "714af891de21fa46ff1ec77d6af7ca707eef8a34d2ed3c5feb6b711d1afc40f0"}
  debug('Apply card verification', pgResponse);
  const { razorpay_payment_id, razorpay_subscription_id } = pgResponse;
  if (!razorpay_subscription_id) {
    const paymentId = razorpay_payment_id;
    debug('Applying card verification');
    try {
      const rzpayment = await RazorPayInstance.payments.fetch(paymentId);
      await RazorPay.refundPayment(paymentId, {
        amount: rzpayment.amount,
        notes: { reason: 'Refund for card verification' },
      });
      const cardUsed = await RazorPay.fetchCard(paymentId);
      debug('Card used', cardUsed);
      if (!cardUsed) {
        return new Meteor.Error('Payment method was not card');
      }

      if (cardUsed.error) {
        return new Meteor.Error('Payment method was not card');
      }

      UserCards.update(
        {
          userId: Meteor.userId(),
        },
        {
          $push: {
            cards: cardUsed,
          },
          $set: {
            updatedAt: new Date(),
          },
        },
        {
          upsert: true,
        }
      );

      return true;
    } catch (err) {
      RavenLogger.log(err);
      console.log(err);
      return false;
    }
  } else {
    debug('Apply card verification');
    return RazorPay.processSubscriptionPayment(pgResponse);
  }
};

RazorPay.createPaymentLink = async ({ amount, description, user, paymentRequest }) => {
  const customerDetails = {
    name: `${user.profile.firstName} ${user.profile.lastName}`,
    email: user.emails[0].address,
  };

  if (user.profile.mobiles && user.profile.mobiles[0]) {
    customerDetails.contact = user.profile.mobiles[0].number;
  }

  if (String(amount).includes('.')) {
    RavenLogger.log('Amount not in paisa', { userId: user._id, amount, description });
    throw new Meteor.Error('Amount not in paisa');
  }

  if (!(paymentRequest && paymentRequest._id)) {
    const conversionFactor = await Payments.getConversionToINRRate({ currencyCode: 'usd' });
    paymentRequest = await Payments.createRequest({
      reason: description,
      amountInPaisa: amount,
      metadata: {
        conversionFactor,
      },
      userId: user._id,
    });
  }

  try {
    const rzpLink = await RazorPayInstance.invoices.create({
      customer: customerDetails,
      type: 'link',
      amount,
      currency: 'INR',
      description,
      expire_by: Math.floor(
        moment()
          .add(30, 'days')
          .toDate()
          .getTime() / 1000
      ),
      notes: {
        paymentRequestId: paymentRequest.paymentRequestId,
        conversionFactor: paymentRequest.conversionFactor,
      },
      sms_notify: '0',
      email_notify: '0',
    });
    const rzLink = RZPaymentLink.insert({ ...rzpLink, userId: user._id, paymentRequestId: paymentRequest.paymentRequestId });
    debug('Create Payment Link | Success', rzpLink);
    return rzLink;
  } catch (err) {
    RavenLogger.log(err);
    debug('Create Payment Link | Error', err);
    return false;
  }
};

RazorPay.cancelPaymentLink = async ({ paymentLinkId, reason, userId }) => {
  if (!reason) {
    throw new Meteor.Error('bad-request', 'Cannot cancel link without reason');
  }
  const rzPaymentLink = RZPaymentLink.find({
    _id: paymentLinkId,
  }).fetch()[0];

  if (!rzPaymentLink) {
    RavenLogger.log('Payment link id not valid', { paymentLinkId });
    throw new Meteor.Error('bad-request', 'Payment link not valid');
  }

  try {
    const cancelResponse = await RazorPayInstance.invoices.cancel(rzPaymentLink.id);
    debug('Cancel Payment Link | Success', cancelResponse);
    Invoice.update(
      {
        'paymentLink.id': paymentLinkId,
      },
      {
        $set: {
          'paymentLink.expired': true,
        },
      }
    );
    RZPaymentLink.update(
      {
        _id: rzPaymentLink._id,
      },
      {
        $set: {
          status: 'cancelled',
          cancelledBy: userId,
        },
      }
    );
    return true;
  } catch (err) {
    RavenLogger.log(err);
    debug('Cancel Payment Link | Error', err);
    return false;
  }
};

RazorPay.processWebHook = async function(req, res) {
  // console.log("Razorpay payload", req.body);
  bullSystem.addJob('razorpay-webhook', req.body);
  res.end('OK');
};

JsonRoutes.add('post', '/api/payments/razorpay/webhook', RazorPay.processWebHook);

Meteor.methods({
  getRazorPayId: async () => {
    return Config.RazorPay.id;
  },
  capturePaymentRazorPay: RazorPay.capturePayment,
  applyRZCardVerification: RazorPay.applyCardVerification,
  cancelPaymentLink: RazorPay.cancelPaymentLink,
});

export default RazorPay;
