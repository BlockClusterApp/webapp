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
  // kafka: {
  //   type: {
  //     cpu: {
  //       type: String,
  //     },
  //     disk: {
  //       type: String,
  //     },
  //     ram: {
  //       type: String,
  //     },
  //     isDiskChangeable: {
  //       type: Boolean,
  //     },
  //   },
  // },
  // orderer: {
  //   type: {
  //     cpu: {
  //       type: String,
  //     },
  //     disk: {
  //       type: String,
  //     },
  //     ram: {
  //       type: String,
  //     },
  //     isDiskChangeable: {
  //       type: Boolean,
  //     },
  //   },
  // },
  // data: {
  //   type: {
  //     disk: {
  //       type: String,
  //     },
  //     isDiskChangeable: {
  //       type: Boolean,
  //     },
  //   },
  // },
  // fabric: {
  //   type: {
  //     version: {
  //       type: String,
  //     },
  //     orderers: {
  //       type: String,
  //     },
  //     peers: {
  //       type: String,
  //     },
  //   },
  // },
  for: {
    type: String,
  },
  category: {
    type: String, // Used in privatehive to store peer or orderer info
  },
  locations: {
    type: Array,
  },
  'locations.$': {
    type: String,
  },
});

if (Meteor.isServer) {
  NetworkConfiguration._ensureIndex({
    for: 1,
  });
  NetworkConfiguration._ensureIndex({
    for: 1,
    name: 1,
    active: 1,
  });
}

export default NetworkConfiguration;
