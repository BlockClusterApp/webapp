import { Mongo } from 'meteor/mongo';

import AttachBaseHooks from '../../modules/helpers/model-helpers';
const IngressStore = new Mongo.Collection('ingressStore');

AttachBaseHooks(IngressStore);

if (Meteor.isServer) {
  IngressStore._ensureIndex({
    instanceId: 1,
    active: 1,
  });
}

export default IngressStore;
