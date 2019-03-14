import { Mongo } from 'meteor/mongo';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const Payment = new Mongo.Collection('stripePayment');
AttachBaseHooks(Payment);

if (Meteor.isServer) {
  Payment._ensureIndex({
    userId: 1,
  });

  Payment._ensureIndex(
    {
      id: 1,
    },
    {
      unique: true,
    }
  );
}

export default Payment;
