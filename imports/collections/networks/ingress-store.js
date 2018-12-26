import { Mongo } from 'meteor/mongo';

const IngressStore = new Mongo.Collection('ingressStore');

if (Meteor.isServer) {
  IngressStore._ensureIndex(
    {
      instanceId: 1,
    },
    {
      unique: true,
    }
  );
}

export default IngressStore;
