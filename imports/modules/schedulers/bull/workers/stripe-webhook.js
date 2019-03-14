import StripePayment from '../../../../collections/stripe/payments';
import StripePaymentIntent from '../../../../collections/stripe/intents';
import PaymentRequests from '../../../../collections/payments/payment-requests';

async function addStripePayment(payment) {
  if (!payment) {
    return true;
  }
  const insertObj = { ...payment };
  delete insertObj.id;
  StripePayment.update(
    {
      id: payment.id,
    },
    {
      $set: {
        ...insertObj,
      },
    },
    {
      upsert: true,
    }
  );

  return true;
}

async function handlePaymentIntentSucceeded(object) {
  const insertObject = { ...object };
  delete insertObject.id;
  insertObject.charge = insertObject.charges.data[0];
  delete insertObject.charges;
  await addStripePayment(insertObject.charge);
  StripePaymentIntent.update(
    {
      id: object.id,
    },
    {
      $set: {
        ...insertObject,
        receipt_url: insertObject.charge.receipt_url,
      },
    },
    {
      upsert: true,
    }
  );

  PaymentRequests.update(
    {
      'pgResponse.id': object.id,
    },
    {
      $set: {
        'pgResponse.$': {
          ...insertObject,
        },
      },
    }
  );

  return true;
}

const EventFns = {
  'charge.captured': async data => {
    const charge = data.object;
    await addStripePayment(charge);
    return true;
  },
  'payment_intent.succeeded': async data => {
    await handlePaymentIntentSucceeded(data.object);
    return true;
  },
};

module.exports = function(bullSystem) {
  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async resolve => {
      const { data } = job.data;
      ElasticLogger.log('Processing Stripe webhook', { data });

      const type = job.data.type;
      if (typeof EventFns[type] === 'function') {
        await EventFns[type](data);
      } else {
        ElasticLogger.log('No handler defined for stripe', {
          data,
          type,
        });
      }
      resolve();
    });
  });
  bullSystem.bullJobs.process('stripe-webhook', 5, processFunction);
};
