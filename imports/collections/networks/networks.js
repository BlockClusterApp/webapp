import { Mongo } from 'meteor/mongo';

const NetworkCollection = new Mongo.Collection('networks');
NetworkCollection.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.active = true;
});

NetworkCollection.before.update((userId, doc, fieldNames, modifier, options) => {
  modifier.$set = modifier.$set || {};
  modifier.$set.updatedAt = new Date();
});

if (Meteor.isServer) {
  NetworkCollection._ensureIndex(
    {
      instanceId: 1,
    },
    {
      unique: true,
    }
  );
}

export const Networks = NetworkCollection;
