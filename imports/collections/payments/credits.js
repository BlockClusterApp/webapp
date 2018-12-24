import { Mongo } from 'meteor/mongo';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const Credits = new Mongo.Collection('userCredits');
AttachBaseHooks(Credits);

Credits.before.update((userId, doc, fieldNames, modifier, options) => {
  modifier.$set = modifier.$set || {};
  modifier.$set.updatedAt = new Date();
});

Credits.schema = new SimpleSchema({
  amount: {
    type: Number,
  },
  userId: {
    type: String,
  },
  code: {
    type: String,
  },
  metadata: {
    type: {
      redemptionId: String,
      invoices: {
        type: Array,
      },
      'invoices.$': {
        type: {
          invoiceId: {
            type: String,
          },
          amount: {
            type: Number,
          },
          claimedOn: {
            type: Date,
          },
        },
      },
    }, // {redemptionId: 'sdf', invoice: [{invoiceId: '1234', amount: 10, claimedOn: date}]}
  },
});

if (Meteor.isServer) {
  Credits._ensureIndex({
    userId: 1,
  });
  Credits._ensureIndex({
    'metadata.redemptionId': 1,
  });
}

export default Credits;
