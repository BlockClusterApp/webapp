import { RZSubscription, RZPayment, RZPaymentLink } from '../../../../collections/razorpay';
import UserCards from '../../../../collections/payments/user-cards';
import PaymentRequest from '../../../../collections/payments/payment-requests';
import Invoice from '../../../../api/billing/invoice';
import InvoiceModel from '../../../../collections/payments/invoice';
import Razorpay from '../../../../api/payments/payment-gateways/razorpay';
import moment from 'moment';
const debug = require('debug')('bull:razorpay');

const PaymentRequestReverseMap = {
  authorized: 1,
  captured: 2,
  refunded: 3,
  failed: 4,
};

async function getUserFromPayment(payment) {
  if (payment.notes && payment.notes.paymentRequestId) {
    const paymentRequest = PaymentRequest.find({
      _id: payment.notes.paymentRequestId,
    }).fetch()[0];
    if (paymentRequest) {
      const user = Meteor.users
        .find({
          _id: paymentRequest.userId,
        })
        .fetch()[0];
      if (!user.rzCustomerId || (!(user.rzCustomerId && user.rzCustomerId.includes(payment.customer_id)) && payment.customer_id)) {
        debug('Updating customer id from payment request', paymentRequest._id, user._id);
        Meteor.users.update(
          {
            _id: user._id,
          },
          {
            $push: {
              rzCustomerId: payment.customer_id,
            },
          }
        );
        return Meteor.users
          .find({
            _id: paymentRequest.userId,
          })
          .fetch()[0];
      }
      return user;
    }
  }
  if (payment.customer_id) {
    const user = Meteor.users
      .find({
        rzCustomerId: payment.customer_id,
      })
      .fetch()[0];
    if (user) {
      debug('Fetched user from customer id', payment.customer_id);
      return user;
    }
  }

  const emailuser = await getUserFromEmail(payment.email);
  if (!emailuser.rzCustomerId || (!(emailuser.rzCustomerId && emailuser.rzCustomerId.includes(payment.customer_id)) && payment.customer_id)) {
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

  return emailuser;
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
  delete updateObject._id;

  ElasticLogger.log('Safeupdate user', { userId, updateObject });

  const updateResult = Meteor.users.update(
    {
      _id: userId,
    },
    {
      ...updateObject,
    }
  );
  return updateResult;
}

async function updateRZPaymentToUser(user, payment) {
  const updateObject = {};
  if (payment.contact) {
    if (!user.profile.mobiles) {
      if (!updateObject.$set) {
        updateObject.$set = {};
      }
      updateObject.$set['profile.mobiles'] = [
        {
          number: payment.contact,
          verified: true,
          from: 'razorpay',
        },
      ];
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
  if (Object.keys(updateObject).length > 0) {
    await safeUpdateUser(user._id, updateObject);
  }

  if (payment.card) {
    const userCards = UserCards.find({
      userId: user._id,
    }).fetch()[0];
    if (userCards) {
      const paymentCard = payment.card;
      const doesCardExists =
        userCards.cards &&
        userCards.cards.find(
          c => c.id === paymentCard.id || (c.last4 === paymentCard.last4 && c.issuer === paymentCard.issuer && c.name === paymentCard.name && c.network === paymentCard.network)
        );
      console.log('Does card exists', doesCardExists);
      if (!doesCardExists) {
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

  if (!paymentRequest) {
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
        $set: {
          paymentStatus: PaymentRequestReverseMap[payment.status],
        },
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
    delete rzPayment.history;
    RZPayment.update(
      {
        _id: rzPayment._id,
      },
      {
        $set: {
          ...payment,
          userId: rzPayment.userId,
        },
        $push: {
          history: rzPayment,
        },
      }
    );
    return true;
  }
  RZPayment.insert({
    userId: user._id,
    ...payment,
  });
  return true;
}

async function insertOrUpdateSubscription(event, { user, subscription, payment }, bullSystem) {
  const rzSubscription = RZSubscription.find({
    id: subscription.id,
  }).fetch()[0];
  if (!rzSubscription) {
    RavenLogger.log('RazorpayWebook | insertOrUpdateSubscription | RZSubscription does not exists', {
      event,
      user,
      subscription,
      payment,
    });
    return;
  }
  if (!(rzSubscription.payments && rzSubscription.payments.map(p => p.id).includes(payment.id))) {
    RZSubscription.update(
      {
        _id: rzSubscription._id,
      },
      {
        $set: {
          status: subscription.status,
        },
        $push: {
          payments: payment,
          statusHistory: {
            status: subscription.status,
            updatedAt: new Date(),
          },
        },
        $unset: {
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
        $set: {
          status: subscription.status,
        },
        $push: {
          statusHistory: {
            status: subscription.status,
            updatedAt: new Date(),
          },
        },
      }
    );
  }

  if (event === 'subscription.charged') {
    const rzInvoiceId = await Invoice.settleInvoice({
      rzSubscriptionId: rzSubscription.id,
      rzCustomerId: subscription.customer_id,
      billingMonth: moment(subscription.current_start * 1000)
        .subtract(1, 'month')
        .toDate(),
      rzPayment: payment,
    });
    // bullSystem.addJob('payment-made-email', {
    //   invoiceId: rzInvoiceId,
    //   user,
    //   subscription,
    //   payment,
    //   event,
    // });
  }

  return true;
}

async function handleSubscriptionHalted({ subscription }, bullSystem) {
  const rzSubscription = RZSubscription.find({
    id: subscription.id,
  }).fetch()[0];

  if (!rzSubscription) {
    RavenLogger.log('RazorPayWebhook | HandleSubscriptionHalted: RZSubscription does not exists', {
      subscription,
    });
    return;
  }

  RZSubscription.update(
    {
      _id: rzSubscription._id,
    },
    {
      $set: {
        status: subscription.status,
      },
      $push: {
        statusHistory: {
          status: subscription.status,
          updatedAt: new Date(),
        },
      },
    }
  );

  const invoice = InvoiceModel.find({
    paymentStatus: InvoiceModel.PaymentStatusMapping.Pending,
    rzCustomerId: subscription.customer_id,
    rzSubscriptionId: subscription.id,
  }).fetch()[0];

  if (!invoice) {
    ElasticLogger.log('No invoice to be halted', { subscriptionId: subscription.id });
  }

  InvoiceModel.update(
    {
      _id: invoice._id,
    },
    {
      $set: {
        paymentStatus: InvoiceModel.PaymentStatusMapping.Failed,
        paymentFailedOn: new Date(),
      },
    }
  );

  bullSystem.addJob('notify-subscription-halted', {
    subscription,
  });

  return true;
}

async function updateFailedInvoice({ payment }) {
  const rzInvoice = await Razorpay.fetchInvoices({ paymentId: payment.id, customerId: payment.customer_id });
  if (!rzInvoice) {
    RavenLogger.log('RazorpayWebhook | updateFailedInvoice : Error handling invoice', { payment });
    return;
  }

  const rzSubscription = RZSubscription.find({
    id: rzInvoice.subscription_id,
  }).fetch()[0];

  if (!rzSubscription) {
    return true;
  }

  RZSubscription.update(
    {
      _id: rzSubscription._id,
    },
    {
      $set: {
        rzInvoiceId: payment.invoice_id,
        lastPaymentAttempt: new Date(),
      },
    }
  );

  return true;
}

async function handleInvoicePaid({ invoice, payment }) {
  const rzPaymentLink = RZPaymentLink.find({
    id: invoice.id,
  }).fetch()[0];

  if (rzPaymentLink) {
    RZPaymentLink.update(
      {
        _id: rzPaymentLink._id,
      },
      {
        $set: {
          status: 'paid',
        },
      }
    );
    const invoice = InvoiceModel.find({
      'paymentLink.id': rzPaymentLink._id,
    }).fetch()[0];

    if (!payment.notes) {
      payment.notes = {
        paymentRequestId: rzPaymentLink.paymentRequestId,
      };
    }

    if (!payment.notes.paymentRequestId) {
      payment.notes.paymentRequestId = rzPaymentLink.paymentRequestId;
    }

    await attachPaymentToRequest(payment);
    if (invoice) {
      return Invoice.settleInvoice({
        invoiceId: invoice._id,
        rzPayment: payment,
      });
    }
    return true;
  }

  // we only want the halted subscriptions to trigger this as others will be processed by subscription.charged
  const rzSubscription = RZSubscription.find({
    id: invoice.subscription_id,
    status: 'halted',
  }).fetch()[0];
  if (!rzSubscription) {
    RavenLogger.log('RazorPayWebhook | handleInvoicePaid : Invoice paid for unknown subscription', { invoice, payment });
    return;
  }
  RZSubscription.update(
    {
      _id: rzSubscription._id,
    },
    {
      $set: {
        status: 'active',
      },
      $push: {
        statusHistory: {
          status: 'active',
          updatedAt: new Date(),
        },
      },
    }
  );

  await Invoice.settleInvoice({
    rzSubscriptionId: rzSubscription.id,
    rzCustomerId: invoice.customer_id,
    billingMonth: moment(invoice.paid_at * 1000)
      .subtract(1, 'month')
      .toDate(),
    rzPayment: payment,
  });

  return true;
}

const HandlerFunctions = {
  'payment.authorized': async ({ data }) => {
    const payment = data.payload.payment.entity;
    const user = await getUserFromPayment(payment);
    await updateRZPaymentToUser(user, data.payload.payment.entity);
    await insertOrUpdatePayment(user._id, payment);
    return true;
  },
  'payments.captured': async ({ data }) => {
    const payment = data.payload.payment.entity;
    const user = await getUserFromPayment(payment);
    await updateRZPaymentToUser(user, data.payload.payment.entity);
    return true;
  },
  'payments.failed': async ({ data }) => {
    const payment = data.payload.payment.entity;
    const user = await getUserFromPayment(payment);
    await insertOrUpdatePayment(user, payment);
    await updateFailedInvoice({ user, payment });
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
          status: subscription.status,
          paymentFailedDate: new Date(),
        },
        $push: {
          statusHistory: {
            status: subscription.status,
            updatedAt: new Date(),
          },
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
    await insertOrUpdateSubscription('subscription.authorized', { user, subscription, payment });

    return true;
  },
  'subscription.charged': async ({ data }, bullSystem) => {
    let { subscription, payment } = data.payload;
    subscription = subscription.entity;
    payment = payment.entity;

    const user = await getUserFromPayment(payment);
    await insertOrUpdatePayment(user, payment);
    await insertOrUpdateSubscription('subscription.charged', { user, subscription, payment }, bullSystem);

    return true;
  },
  'subscription.halted': async ({ data }, bullSystem) => {
    const subscription = data.payload.subscription.entity;
    await handleSubscriptionHalted({ subscription }, bullSystem);

    return true;
  },
  'invoice.paid': async ({ data }, bullSystem) => {
    let { invoice, payment } = data.payload;
    invoice = invoice.entity;
    payment = payment.entity;
    const user = await getUserFromPayment(payment);
    await updateRZPaymentToUser(user, data.payload.payment.entity);
    await insertOrUpdatePayment(user, payment);
    await handleInvoicePaid({ payment, invoice }, bullSystem);

    return true;
  },
};

module.exports = function(bullSystem) {
  const processFunction = function(job) {
    return new Promise(async resolve => {
      const data = job.data;
      ElasticLogger.log('Processing razorpay webhook', { ...data });
      if (typeof HandlerFunctions[data.event] === 'function') {
        await HandlerFunctions[data.event]({ data }, bullSystem);
      } else {
        console.log('Razorpay webhook not handled', data.event);
      }
      return resolve(true);
    });
  };

  bullSystem.bullJobs.process('razorpay-webhook', processFunction);
};
