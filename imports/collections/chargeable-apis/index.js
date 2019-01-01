import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const ChargeableAPI = new Mongo.Collection('chargeableAPI');

AttachBaseHooks(ChargeableAPI);

ChargeableAPI.schema = new SimpleSchema({
  url: {
    type: String,
  },
  userId: {
    type: String,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  metadata: {
    type: Object,
  },
  active: {
    type: Boolean,
  },
  serviceType: {
    type: String,
  },
});

if (!Meteor.isClient) {
  ChargeableAPI._ensureIndex({
    userId: 1,
  });
}

export default ChargeableAPI;
