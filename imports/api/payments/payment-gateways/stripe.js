import StripeCustomer from '../../../collections/stripe/customer';
import { Meteor } from 'meteor/meteor';
import UserCards from '../../../collections/payments/user-cards';
import StripePayment from '../../../collections/stripe/payments';

const stripToken = process.env.STRIPE_TOKEN || 'sk_test_DhE17qCC4NfY1A1SUygZWMkh';
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
  // if (stripeCustomer) {
  //   throw new Meteor.Error(400, 'Already verified');
  // }
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
  );

  Meteor.users.update(
    {
      _id: userId,
    },
    {
      $set: {
        stripeCustomerId: customer.id,
      },
    }
  );

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

export default Stripe;
