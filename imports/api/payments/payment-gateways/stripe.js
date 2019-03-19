import StripeCustomer from '../../../collections/stripe/customer';
import { Meteor } from 'meteor/meteor';
import UserCards from '../../../collections/payments/user-cards';
import StripePayment from '../../../collections/stripe/payments';
import PaymentIntent from '../../../collections/stripe/intents';
import RazorPaySubscription from '../../../collections/razorpay/subscription';
import Bluebird from 'bluebird';
import RazorPay from './razorpay';
import bodyParser from 'body-parser';
import Vouchers from '../../network/voucher';
import Bull from '../../../modules/schedulers/bull/index';

const stripToken = process.env.STRIPE_TOKEN || 'sk_test_DhE17qCC4NfY1A1SUygZWMkh';
const webhookSecret = (() => {
  if (process.env.NODE_ENV === 'development') {
    return 'whsec_swM3UT7OKabQLts7D0iRWk7odkI2cwnt';
  }
  if (process.env.NODE_ENV === 'dev') {
    return 'whsec_ojlYUMgiI5qubxuSgrjACnMdXPdUkX79';
  }
  if (process.env.NODE_ENV === 'test') {
    return 'whsec_9hHshZ682mVoFxMnUOmGFWYMMUYuolfx';
  }
  if (process.env.NODE_ENV === 'production') {
    return 'whsec_AkcTEzsOXTySpuUF3cYM3UlF1wXsZCxj';
  }
  return 'whsec_swM3UT7OKabQLts7D0iRWk7odkI2cwnt';
})();
const stripe = require('stripe')(stripToken);
const debug = require('debug')('api:stripe');

const Stripe = {};

Stripe.createCustomer = async ({ userId, token }) => {
  if (!(userId && token)) {
    throw new Meteor.Error(400, 'Userid and token required');
  }
  const user = Meteor.users.find({ _id: userId }).fetch()[0];
  if (!user) {
    throw new Meteor.Error(400, 'Invalid userid');
  }

  const stripeCustomer = StripeCustomer.find({ userId }).fetch()[0];
  let customer;
  try {
    if (!stripeCustomer) {
      customer = await stripe.customers.create({
        description: userId,
        source: token.id,
        email: user.emails[0].address,
      });
    } else {
      await stripe.customers.update(stripeCustomer.id, {
        source: token.id,
      });
      customer = await stripe.customers.retrieve(stripeCustomer.id);
    }
  } catch (err) {
    throw new Meteor.Error(400, err.toString().replace('Error: ', ''));
  }

  debug('Stripe customer', customer);
  const card = {
    id: token.card.id,
    entity: 'card',
    source: 'stripe',
    last4: token.card.last4,
    network: token.card.brand,
    type: token.card.funding,
    international: token.card.country !== 'IN',
    emi: false,
    active: true,
  };

  const userCard = UserCards.find({ userId }).fetch()[0];

  if (!(userCard && userCard.cards.map(c => c.id).includes(token.card.id))) {
    let cards = [];
    if (userCard && userCard.cards) {
      userCard.cards.forEach(card => {
        cards.push({ ...card, active: false });
      });
    }
    cards.push(card);
    UserCards.update(
      {
        userId,
      },
      {
        $set: {
          updatedAt: new Date(),
          cards,
        },
      },
      {
        upsert: true,
      }
    );
  }

  const userCards = UserCards.findOne({ userId: Meteor.userId() });
  if (userCards.cards.length === 1) {
    // Credit $200
    try {
      await Vouchers.applyPromotionalCode({ code: 'BLOCKCLUSTER', userId: Meteor.userId() });
    } catch (err) {
      console.log('Blockcluster application error', err);
      // Already claimed. Ignore
    }
  }

  await Bluebird.all([
    StripeCustomer.update(
      {
        userId,
      },
      {
        $set: {
          ...customer,
        },
      },
      {
        upsert: true,
      }
    ),
    Meteor.users.update(
      {
        _id: userId,
      },
      {
        $set: {
          stripeCustomerId: customer.id,
        },
        $unset: {
          rzCustomerId: '',
        },
      }
    ),
  ]);

  const rzSubscriptions = RazorPaySubscription.find({ userId }).fetch();
  if (rzSubscriptions.length > 0) {
    RazorPaySubscription.update(
      {
        userId,
      },
      {
        $set: {
          bc_status: 'cancelled',
        },
      }
    );
    await Bluebird.each(rzSubscriptions, async rzSubscription => {
      return RazorPay.cancelSubscription({ rzSubscription });
    });
  }

  return true;
};

Stripe.chargeCustomer = async ({ customerId, amountInDollars, idempotencyKey, description, userId, metadata }) => {
  if (!(customerId && amountInDollars && idempotencyKey && userId)) {
    throw new Meteor.Error(400, 'CustomerID, amountInDollars, userId and idempotencyKey is required');
  }

  const response = await stripe.charges.create(
    {
      amount: amountInDollars * 100,
      currency: 'usd',
      customer: customerId,
      description,
      metadata: metadata || {},
    },
    {
      idempotency_key: idempotencyKey,
    }
  );

  const id = response.id;
  delete response.id;

  StripePayment.update(
    {
      id,
    },
    {
      $set: {
        userId,
        ...response,
      },
    },
    {
      upsert: true,
    }
  );

  debug('Stripe charged customer', response);

  return { ...response, id };
};

Stripe.createPaymentIntent = async ({ paymentRequest }) => {
  if (!paymentRequest) {
    throw new Meteor.Error(403, 'Payment request not created');
  }
  const response = await stripe.paymentIntents.create({
    amount: paymentRequest.amount * 100,
    currency: 'usd',
    payment_method_types: ['card'],
    receipt_email: 'jibin.mathews@blockcluster.io',
  });

  PaymentIntent.insert({
    userId: paymentRequest.userId,
    paymentRequestId: paymentRequest._id,
    ...response,
  });

  return response;
};

Stripe.fetchSource = async sourceId => {
  if (!sourceId) {
    return {};
  }
  return stripe.sources.retrieve(sourceId);
};

Stripe.processWebHook = async function(req, res) {
  // const sig = req.headers['stripe-signature'];
  try {
    // stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    // console.log(event);
    Bull.addJob('stripe-webhook', req.body, {
      delay: 30 * 1000,
    });
    console.log('Stripe webhook added');
  } catch (err) {
    console.log(err);
    res.statusCode = 400;
    res.end();
  }
  res.end('OK');
};

// JsonRoutes.Middleware.use('/api/payments/stripe/webhook', bodyParser.raw({ type: '*/*' }));
JsonRoutes.add('post', '/api/payments/stripe/webhook', Stripe.processWebHook);

export default Stripe;
