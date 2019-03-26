import { Mongo } from 'meteor/mongo';
import AttachBaseHooks from '../../modules/helpers/model-helpers';

const PrivatehivePeersCollection = new Mongo.Collection('privatehivePeers');
AttachBaseHooks(PrivatehivePeersCollection);

if (Meteor.isServer) {
  PrivatehivePeersCollection._ensureIndex(
    {
      instanceId: 1,
    },
    {
      unique: true,
    }
  );
  PrivatehivePeersCollection._ensureIndex({
    userId: 1,
  });
  PrivatehivePeersCollection._ensureIndex({
    userId: 1,
    instanceId: 1,
  });
}

export const PrivatehivePeers = PrivatehivePeersCollection;
