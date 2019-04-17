import { Mongo } from 'meteor/mongo';
import AttachBaseHooks from '../../modules/helpers/model-helpers';

const PrivatehiveOrderersCollection = new Mongo.Collection('privatehiveOrderers');

AttachBaseHooks(PrivatehiveOrderersCollection);

if (Meteor.isServer) {
  PrivatehiveOrderersCollection._ensureIndex(
    {
      instanceId: 1,
    },
    {
      unique: true,
    }
  );
  PrivatehiveOrderersCollection._ensureIndex({
    userId: 1,
  });
  PrivatehiveOrderersCollection._ensureIndex({
    userId: 1,
    instanceId: 1,
  });
}

export const PrivatehiveOrderers = PrivatehiveOrderersCollection;
