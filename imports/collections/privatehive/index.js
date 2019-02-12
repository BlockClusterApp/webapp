import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const PrivateHive = new Mongo.Collection('privatehive');

AttachBaseHooks(PrivateHive);

PrivateHive.schema = new SimpleSchema({
  instanceId: {
    type: String,
  },
  locationCode: {
    type: String,
  },
  name: {
    type: String,
  },
  nfs: {
    type: Object,
  },
  createdAt: {
    type: Date,
  },
  deletedAt: {
    type: Date,
  },
  networkConfig: {
    type: Object,
  },
  voucher: {
    type: Object,
  },
  userId: {
    type: String,
  },
  isJoin: {
    // If joined network then true
    type: Boolean,
  },
  properties: {
    // Would contain properties like ELB addresses, node ports, IP addreses
    type: Boolean,
  },
  status: {
    // Internal status.
    type: String,
  },
});

if (Meteor.isServer) {
  PrivateHive._ensureIndex(
    {
      instanceId: 1,
    },
    {
      unique: true,
    }
  );
  PrivateHive._ensureIndex({
    userId: 1,
  });
  PrivateHive._ensureIndex({
    userId: 1,
    instanceId: 1,
  });
}

export default PrivateHive;
