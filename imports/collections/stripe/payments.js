import { Mongo } from 'meteor/mongo';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const Payment = new Mongo.Collection('stripePayment');
AttachBaseHooks(Payment);

if (Meteor.isServer) {
  Payment._ensureIndex({
    userId: 1,
  });
}

export default Payment;
