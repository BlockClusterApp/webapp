import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import AttachBaseHooks from '../../modules/helpers/model-helpers';
import { Meteor } from 'meteor/meteor';

const HyperionPricing = new Mongo.Collection('hyperionPricing');

AttachBaseHooks(HyperionPricing);

HyperionPricing.schema = new SimpleSchema({
  minimumMonthlyCost: {
    type: Number,
  },
  perApiCost: {
    type: Number,
  },
  perGBCost: {
    type: Number,
  },
  perGBDataTransferCost: {
    type: Number,
  },
  active: {
    type: Boolean,
  },
  createdBy: {
    type: String,
  },
  deletedBy: {
    type: String,
  },
});

if (Meteor.isServer) {
  HyperionPricing._ensureIndex({
    active: 1,
  });
}

export default HyperionPricing;
