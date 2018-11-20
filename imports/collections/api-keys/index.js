import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import AttachBaseHooks from '../../modules/helpers/model-helpers';
import { Meteor } from 'meteor/meteor';

const ApiKeyCollection = new Mongo.Collection('apiKeys');

AttachBaseHooks(ApiKeyCollection);

ApiKeyCollection.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.active = true;
  if (!doc.userId) {
    doc.userId = Meteor.userId()
  }
});


ApiKeyCollection.schema = new SimpleSchema({
  key: {
    type: String
  },
  createdAt: {
    type: Date
  },
  active: {
    type: Boolean
  },
  userId: {
    type: String
  }
});

if(Meteor.isServer) {
  ApiKeyCollection._ensureIndex({
    key: 1
  });
}

export default ApiKeyCollection;
