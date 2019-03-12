import { Mongo } from 'meteor/mongo';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const Customer = new Mongo.Collection('stripeCustomer');
AttachBaseHooks(Customer);

if (Meteor.isServer) {
  Customer._ensureIndex({
    userId: 1,
  });
}

export default Customer;
