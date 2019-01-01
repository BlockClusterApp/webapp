import { Mongo } from 'meteor/mongo';

import SimpleSchema from 'simpl-schema';

import AttachBaseHooks from '../../modules/helpers/model-helpers';
import { Meteor } from 'meteor/meteor';

const Redemption = new Mongo.Collection('creditRedemption');

AttachBaseHooks(Redemption);

Redemption.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  if (!doc.hasOwnProperty('active')) {
    doc.active = true;
  }
  if (!doc.hasOwnProperty('userId')) {
    throw new Error('Cannot insert credit redemption without a user');
  }
});

Redemption.schema = new SimpleSchema({
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  code: {
    type: String,
  },
  codeId: {
    type: String,
  },
  userId: {
    type: String,
  },
  active: {
    type: Boolean,
  },
});

if (Meteor.isServer) {
  Redemption._ensureIndex({
    userId: 1,
  });
  Redemption._ensureIndex({
    code: 1,
  });
  Redemption._ensureIndex({
    userId: 1,
    code: 1,
  });
  Redemption._ensureIndex({
    codeId: 1,
  });
  Redemption._ensureIndex({
    userId: 1,
    codeId: 1,
  });
}

export default Redemption;
