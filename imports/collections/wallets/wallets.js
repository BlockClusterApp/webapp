import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

const wallet = new Mongo.Collection('wallets');

if (Meteor.isServer) {
  wallet._ensureIndex(
    {
      address: 1,
      coinType: 1,
    },
    {
      unique: true,
    }
  );
  wallet._ensureIndex({
    userId: 1,
  });
  wallet._ensureIndex({
    userId: 1,
    _id: 1,
  });
}

export const Wallets = wallet;
