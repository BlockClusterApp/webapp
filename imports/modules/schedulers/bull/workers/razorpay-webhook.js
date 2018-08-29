import { RZPlan, RZSubscription, RZPayment } from '../../../../collections/razorpay';
import UserCards from '../../../../collections/payments/user-cards';
import PaymentRequest from '../../../../collections/payments/payment-requests';
import Invoice from '../../../../api/billing/invoice';
import moment from 'moment';
const debug = require('debug')('bull:razorpay');

const PaymentRequestReverseMap = {
  authorized: 1,
  captured: 2,
  refunded: 3,
  failed: 4,
};

async function getUserFromPayment(payment) {
  const user = Meteor.users
    .find({
      rzCustomerId: payment.customer_id,
    })
    .fetch()[0];
  if (user) {
    debug('Fetched user from customer id', payment.customer_id);
    return user;
  }
  if (payment.notes.paymentRequestId) {
    const request = PaymentRequest.find({
      _id: id,
    }).fetch()[0];
    const user = Meteor.users
      .find({
        _id: request.userId,
      })
      .fetch()[0];
    if (!user.rzCustomerId || !(user.rzCustomerId && user.rzCustomerId.includes(payment.customer_id))) {
      debug('Updating customer id from payment request', request._id, user._id);
      Meteor.users.update(
        {
          'emails.address': payment.email,
        },
        {
          $push: {
            rzCustomerId: payment.customer_id,
          },
        }
      );
    }
    return Meteor.users.find({ _id: user._id }).fetch()[0];
  }
  const emailuser = await getUserFromEmail(payment.email);
  if (!emailuser.rzCustomerId || !(emailuser.rzCustomerId && emailuser.rzCustomerId.includes(payment.customer_id))) {
    debug('Updating customer id from email', payment.email, payment.customer_id);
    Meteor.users.update(
      {
        _id: emailuser._id,
      },
      {
        $push: {
          rzCustomerId: payment.customer_id,
        },
      }
    );
    return Meteor.users
      .find({
        _id: emailuser._id,
      })
      .fetch()[0];
  }
}


async function getUserFromEmail(email) {
  const user = Meteor.users
    .find({
      'emails.address': email,
    })
    .fetch()[0];

  return user;
}

async function safeUpdateUser(userId, updateObject) {
  delete updateObject.emails;
  delete updateObject.services;
  delete updateObject.createdAt;
  delete updateObject.admin;

  const updateResult = Meteor.users.update(
    {
      _id: userId,
    },
    {
      $set: updateObject,
    }
  );
  return updateResult;
}

async function updateRZPaymentToUser(user, payment) {
  const updateObject = {};
  if (payment.contact) {
    if (!user.profile.mobiles) {
      if(!updateObject.$set) {
        updateObject.$set = {};
      }
      updateObject.$set.profile = {
        mobiles: [
          {
            number: payment.contact,
            verified: true,
            from: 'razorpay',
          },
        ],
      };
    } else if (!(user.profile.mobiles && user.profile.mobiles.map(m => m.number).includes(payment.contact))) {
      updateObject.$push = {
        'profile.mobiles': {
          number: payment.contact,
          verified: true,
          from: 'razorpay',
        },
      };
    }
  }
  // if(payment.customer_id && (!user.rzCustomerId || !(user.rzCustomerId && user.rzCustomerId.includes(payment.customer_id)))) {
  //   if(!updateObject.$push) {
  //     updateObject.$push = {};
  //   }
  //   updateObject.$push.rzCustomerId = payment.customer_id;
  // }
  if (Object.keys(updateObject).length > 0) {
    await safeUpdateUser(user._id, updateObject);
  }

  if (payment.card) {
    const userCards = UserCards.find({
      userId: user._id,
    }).fetch()[0];
    if (userCards) {
      if (userCards.cards && !userCards.cards.map(c => c.id).includes(payment.card.id)) {
        UserCards.update(
          {
            _id: userCards._id,
          },
          {
            $push: {
              cards: payment.card,
            },
          }
        );
      }
    } else {
      UserCards.insert({
        userId: user._id,
        cards: [{ ...payment.card }],
      });
    }
  }

  return true;
}

async function attachPaymentToRequest(payment) {
  if (!payment.notes.paymentRequestId) {
    return true;
  }

  const paymentRequest = PaymentRequest.find({
    _id: payment.notes.paymentRequestId,
  }).fetch()[0];
  
  if(!paymentRequest) {
    return false;
  }

  if (!paymentRequest.pgResponse || !(paymentRequest.pgResponse && paymentRequest.pgResponse.map(p => p.id).includes(payment.id))) {
    PaymentRequest.update(
      {
        _id: paymentRequest._id,
      },
      {
        $push: {
          pgResponse: payment,
        },
        paymentStatus: PaymentRequestReverseMap[payment.status],
      }
    );
  }
  return true;
}


async function insertOrUpdatePayment(user, payment) {
  if (payment.notes.paymentRequestId) {
    try {
      await attachPaymentToRequest(payment);
    } catch (err) {
      debug('Attaching to Request err', err);
    }
  }

  const rzPayment = RZPayment.find({ id: payment.id }).fetch()[0];
  if (rzPayment) {
    return true;
  }
  RZPayment.insert({
    userId: user._id,
    ...payment,
  });
  return true;
}

async function insertOrUpdateSubscription(event, { user, subscription, payment }) {
  const rzSubscription = RZSubscription.find({
    id: subscription.id,
  }).fetch()[0];
  if (!rzSubscription) {
    throw new Error(`RZ Subscription ${subscription.id} does not exists`);
  }
  if (!(rzSubscription.payments && rzSubscription.payments.map(p => p.id).includes(payment.id))) {
    RZSubscription.update(
      {
        _id: rzSubscription._id,
      },
      {
        $push: {
          payments: payment,
        },
        $unset: {
          currentStatus: '',
          paymentFailedDate: '',
        },
      }
    );
  } else {
    RZSubscription.update(
      {
        _id: rzSubscription._id,
      },
      {
        $unset: {
          currentStatus: '',
          paymentFailedDate: '',
        },
      }
    );
  }

  if (event === 'subscription.charged') {
    await Invoice.settleInvoice({
      rzSubscriptionId: rzSubscription.id,
      rzCustomerId: subscription.customer_id,
      billingMonth: moment(subscription.charge_at * 1000).subtract(1, 'month').toDate(),
      rzPayment: payment,
    });
  }

  return true;
}

const HandlerFunctions = {
  'payment.authorized': async ({ data }) => {
    const payment = data.payload.payment.entity;
    const user = await getUserFromPayment(payment);
    updateRZPaymentToUser(user, data.payload.payment.entity);
    await insertOrUpdatePayment(user._id, payment);
    return true;
  },
  'payments.captured': async ({ data }) => {
    const payment = data.payload.payment.entity;
    const user = await getUserFromPayment(payment);
    updateRZPaymentToUser(user, data.payload.payment.entity);
    return true;
  },
  'payments.failed': async ({ data }) => {
    const payment = data.payload.payment.entity;
    const user = await getUserFromPayment(payment);
    insertOrUpdatePayment(user, payment);
    return true;
  },
  'subscription.pending': async ({ data }) => {
    let { subscription } = data.payload;
    RZSubscription.update(
      {
        id: subscription.id,
      },
      {
        $set: {
          currentStatus: 'payment failed',
          paymentFailedDate: new Date(),
        },
      }
    );
    return true;
  },
  'subscription.authorized': async ({ data }) => {
    let { subscription, payment } = data.payload;
    subscription = subscription.entity;
    payment = payment.entity;

    const user = await getUserFromPayment(payment);
    await insertOrUpdatePayment(user, payment);
    await insertOrUpdateSubscription('subscription.activated', { user, subscription, payment });

    return true;
  },
  'subscription.charged': async ({ data }) => {
    let { subscription, payment } = data.payload;
    subscription = subscription.entity;
    payment = payment.entity;

    const user = await getUserFromPayment(payment);
    await insertOrUpdatePayment(user, payment);
    await insertOrUpdateSubscription('subscription.charged', { user, subscription, payment });

    return true;
  },
};

module.exports = function(bullSystem) {
  const processFunction = function(job) {
    return new Promise(async resolve => {
      const data = job.data;
      if (typeof HandlerFunctions[data.event] === 'function') {
        await HandlerFunctions[data.event]({ data });
      } else {
        console.log('Razorpay webhook not handled', data.event);
      }
      return resolve(true);
    });
  };

  bullSystem.bullJobs.process('razorpay-webhook', processFunction);
};
