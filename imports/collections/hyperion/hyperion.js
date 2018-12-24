import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

const _Hyperion = new Mongo.Collection('hyperion');

if (Meteor.isServer) {
  _Hyperion._ensureIndex(
    {
      userId: 1,
    },
    {
      unique: true,
    }
  );
}

export const Hyperion = _Hyperion;
