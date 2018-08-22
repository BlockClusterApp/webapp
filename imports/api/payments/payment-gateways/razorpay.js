import razorpay from "razorpay";
import Config from "../../../modules/config/server";
import UserCards from "../../../collections/payments/user-cards";
import PaymentRequests from "../../../collections/payments/payment-requests";
import request from "request";
import { RZPlan, RZSubscription, RZAddOn } from '../../../collections/razorpay';
import moment from 'moment';

const debug = require("debug")("api:razorpay");

const RazorPayInstance = new razorpay({
  key_id: Config.RazorPay.id,
  key_secret: Config.RazorPay.secret
});

const RazorPay = {};

const RZ_URL = `https://${Config.RazorPay.id}:${
  Config.RazorPay.secret
}@api.razorpay.com`;

function getStartDate(){
    return moment().add(1, 'month').startOf('month').add(5, 'days').add(5, 'hour');
}

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
RazorPay.createPlan = async ({params, identifier}) => {
  let rzPlan;
  try{
    rzPlan = await RazorPayInstance.plans.create(params);
    debug('CreatePlan | RzPlan Response', rzPlan);
  } catch(err){
    debug('CreatePlan | error razorpay', err);
    return false;
  }

  const rzPlanId = RZPlan.insert({...rzPlan, identifier})
  return RZPlan.find({_id: rzPlanId}).fetch()[0];
}

RazorPay.createSubscription = async ({rzPlan, type}) => {
  type = type || 'Node Monthly';
  let rzSubscription;
  try{
    rzSubscription = await RazorPayInstance.subscriptions.create({
      plan_id: rzPlan.id,
      "customer_notify": 0,
      "total_count": 12 * 10,
      "start_at": Math.floor(getStartDate().toDate().getTime() / 1000),
    });
    debug('CreateSubscription | RzSubscription Response', rzPlan);
  } catch(err) {
    debug('CreateSubscription | error razorpay', err);
    return false;
  }
  const rzSubscriptionId = RZSubscription.insert({...rzSubscription, userId: Meteor.userId(), type: 'Node Monthly'});
  return RZSubscription.find({_id: rzSubscriptionId}).fetch()[0];
}

RazorPay.cancelSubscription = async ({rzSubscription}) => {
  // Cancels the subscription at the end of cycle so that the we can attach addons before the 5th of next month.
  try{
    const cancelResponse = await RazorPayInstance.subscriptions.cancel(rzSubscription.id, true);
    debug('Cancel Subscription | Response', cancelResponse);
    RZSubscription.update({
      _id: rzSubscription._d
    }, {
      $set: {
        bc_status: 'cancelled'
      }
    })
    return cancelResponse;
  }catch(err){
    debug('Cancel Subscription | Error', err);
  }

  return false;
}

RazorPay.createAddOn = async ({subscriptionId, addOn}) => {
  try{
    const addOnResponse = await RazorPayInstance.subscriptions.createAddon(subscriptionId, {
      item: {
        name: addOn.name,
        description: addOn.description,
        amount: addOn.amount,
        currency: addOn.currency || 'INR'
      },
      quantity: addOn.quantity || 1,
      subscription_id: subscriptionId
    });
    debug('Cancel AddOn | Response', addOnResponse);
    const addOnId = RZAddOn.insert({...addOnResponse, userId: Meteor.userId()});
    return RZAddOn.find({_id: addOnOn}).fetch()[0];
  } catch(err) {
    debug('Create AddOn | Error', err);
  }
}





RazorPay.capturePayment = async paymentResponse => {
  let rzpayment = { notes: {} };
  debug("Razorpay response", paymentResponse);
  try {
    // First update payment status
    rzpayment = await RazorPayInstance.payments.fetch(
      paymentResponse.razorpay_payment_id
    );
    debug("Razorpay payment", rzpayment);
    if (!rzpayment) {
      throw new Error("Invalid razorpay payment id");
    }
    const paymentRequest = PaymentRequests.find({
      _id: rzpayment.notes.paymentRequestId
    }).fetch()[0];

    if (!paymentRequest) {
      throw new Error(
        "Invalid payment request id for rzpayment ",
        paymentResponse
      );
    }

    PaymentRequests.update(
      {
        _id: rzpayment.notes.paymentRequestId
      },
      {
        $set: {
          paymentStatus: PaymentRequests.StatusMapping.Approved,
          pgReference: paymentResponse.razorpay_payment_id,
        },
        $push: {
          pgResponse: rzpayment
        }
      }
    );
    const amount = paymentRequest.amount || 100;
    const captureResponse = await RazorPayInstance.payments.capture(
      paymentResponse.razorpay_payment_id,
      amount
    );
    debug("Capture response ", captureResponse);

    PaymentRequests.update(
      {
        _id: rzpayment.notes.paymentRequestId
      },
      {
        $push: {
          pgResponse: captureResponse
        }
      }
    );
  } catch (err) {
    // rollback
    debug("Error capturing", err);
    PaymentRequests.update(
      {
        _id: rzpayment.notes.paymentRequestId
      },
      {
        $set: {
          paymentStatus: PaymentRequests.StatusMapping.Pending
        }
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
RazorPay.refundPayment = async (paymentId, options) => {
  if (!options.amount) {
    throw new Error("Amount not specified for refund");
  }

  const paymentRequest = PaymentRequests.find({
    pgReference: paymentId,
    "pgResponse.status": "captured"
  });

  if (!paymentRequest) {
    throw new Error(`Invalid payment Id ${paymentId}`);
  }

  if (!options.amount) {
    options.amount = paymentRequest.amount;
  }

  options.notes = options.notes || {};
  options.notes.reason = options.notes.reason || "Refund from backend";

  try {
    const refundResponse = await RazorPayInstance.payments.refund(
      paymentId,
      options
    );
    debug("refund response ", refundResponse);

    const updateResult = PaymentRequests.update(
      {
        pgReference: paymentId
      },
      {
        $set: {
          paymentStatus: PaymentRequests.StatusMapping.Refunded,
          refundedAt: new Date()
        },
        $push: {
          pgResponse: refundResponse
        }
      }
    );

    debug("Refund updated", updateResult)

    return updateResult;
  } catch (err) {
    debug("Refund error", err);
    // rollback
  }
};

RazorPay.fetchCard = paymentId => {
  return new Promise((resolve, reject) => {
    request.get(`${RZ_URL}/v1/payments/${paymentId}/card`, (err, res, body) => {
      if (err) {
        return reject(err);
      }
      resolve(JSON.parse(body));
    });
  });
};

RazorPay.applyCardVerification = async paymentId => {
  debug("Applying card verification");
  try {
    const rzpayment = await RazorPayInstance.payments.fetch(paymentId);
    await RazorPay.refundPayment(paymentId, {
      amount: rzpayment.amount,
      notes: { reason: "Refund for card verification" }
    });
    const cardUsed = await RazorPay.fetchCard(paymentId);
    debug("Card used", cardUsed);
    if (!cardUsed) {
      return new Meteor.Error("Payment method was not card");
    }

    if (cardUsed.error) {
      return new Meteor.Error("Payment method was not card");
    }

    UserCards.update(
      {
        userId: Meteor.userId()
      },
      {
        $push: {
          cards: cardUsed
        },
        $set: {
          updatedAt: new Date()
        }
      },
      {
        upsert: true
      }
    );

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

Meteor.methods({
  getRazorPayId: async () => {
    return Config.RazorPay.id
  }
});

export default RazorPay;
