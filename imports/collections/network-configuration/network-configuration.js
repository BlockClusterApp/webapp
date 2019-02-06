import { Mongo } from 'meteor/mongo';

import SimpleSchema from 'simpl-schema';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const NetworkConfiguration = new Mongo.Collection('networkConfig');

AttachBaseHooks(NetworkConfiguration);

NetworkConfiguration.schema = new SimpleSchema({
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  name: {
    type: String,
  },
  cpu: {
    type: Number,
  },
  ram: {
    type: Number,
  },
  disk: {
    type: Number,
  },
  isDiskChangeable: {
    type: Boolean,
  },
  showInNetworkSelection: {
    type: Boolean,
  },
  cost: {
    type: {
      monthly: {
        type: String,
      },
      hourly: String,
    },
  },
  for: {
    type: String,
  },
});

export default NetworkConfiguration;
