import StripeCustomer from '../../../collections/stripe/customer';
import { Meteor } from 'meteor/meteor';
import UserCards from '../../../collections/payments/user-cards';
import StripePayment from '../../../collections/stripe/payments';

const stripToken = process.env.STRIPE_TOKEN || 'sk_test_DhE17qCC4NfY1A1SUygZWMkh';
const stripe = require('stripe')(stripToken);
const debug = require('debug')('api:stripe');

const Stripe = {};

/*
card: {
  address_city: null
  address_country: null
  address_line1: null
  address_line1_check: null
  address_line2: null
  address_state: null
  address_zip: null
  address_zip_check: null
  brand: "MasterCard"
  country: "IN"
  cvc_check: "unchecked"
  dynamic_last4: null
  exp_month: 1
  exp_year: 2021
  funding: "credit"
  id: "card_1ED72sG3zAADSv7BchxzlZN9"
  last4: "7689"
  metadata: {}
  name: "Jibin Mathews"
  object: "card"
  tokenization_method: null
}
client_ip: "49.207.54.118"
created: 1552383434
email: "jibin.mathews@blockcluster.io"
id: "tok_1ED72sG3zAADSv7B1lSZ3E2m"
livemode: false
object: "token"
type: "card"
used: false
*/

Stripe.createCustomer = async ({ userId, token }) => {
  if (!(userId && token)) {
    throw new Meteor.Error(400, 'Userid and token required');
  }
  const user = Meteor.users.find({ _id: userId }).fetch()[0];
  if (!user) {
    throw new Meteor.Error(400, 'Invalid userid');
  }

  const stripeCustomer = StripeCustomer.find({ userId }).fetch()[0];
  if (stripeCustomer) {
    throw new Meteor.Error(400, 'Already verified');
  }
  const customer = await stripe.customers.create({
    description: userId,
    source: token.id,
    email: user.emails[0].address,
  });

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
    UserCards.update(
      {
        userId,
      },
      {
        $push: {
          cards: card,
        },
        $set: {
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
      }
    );
  }

  StripeCustomer.insert({
    userId,
    ...customer,
  });

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

Stripe.chargeCustomer = async ({ customerId, amountInDollars, idempotencyKey, description, userId }) => {
  if (!(customerId && amountInDollars && idempotencyKey && userId)) {
    throw new Meteor.Error(400, 'CustomerID, amountInDollars, userId and idempotencyKey is required');
  }

  const response = await stripe.charges.create(
    {
      amount: amountInDollars * 100,
      currency: 'usd',
      customer: customerId,
      description,
    },
    {
      idempotency_key: idempotencyKey,
    }
  );

  StripePayment.insert({
    userId,
    ...response,
  });

  debug('Stripe charged customer', response);

  return response;
};

export default Stripe;
