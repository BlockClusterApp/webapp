import { Mongo } from 'meteor/mongo';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const PaymentIntent = new Mongo.Collection('stripePaymentIntent');
AttachBaseHooks(PaymentIntent);

if (Meteor.isServer) {
  PaymentIntent._ensureIndex({
    userId: 1,
  });
  PaymentIntent._ensureIndex({
    id: 1,
  });
}

export default PaymentIntent;
