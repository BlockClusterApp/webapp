import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import AttachBaseHooks from '../../modules/helpers/model-helpers';
import { Meteor } from 'meteor/meteor';

const PaymeterPricing = new Mongo.Collection('paymeterPricing');

AttachBaseHooks(PaymeterPricing);

PaymeterPricing.schema = new SimpleSchema({
  minimumMonthlyCost: {
    type: Number,
  },
  perApiCost: {
    type: Number,
  },
  perWalletCost: {
    type: Number,
  },
  perTransactionCost: {
    type: Number,
  },
  perTransactionCostFlat: {
    type: Number,
  },
  active: {
    type: Boolean,
  },
  createdBy: {
    type: String,
  },
});

if (Meteor.isServer) {
  PaymeterPricing._ensureIndex({
    active: 1,
  });
}

export default PaymeterPricing;
