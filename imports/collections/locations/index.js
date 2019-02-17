import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const LocationConfiguration = new Mongo.Collection('locationConfig');

AttachBaseHooks(LocationConfiguration);

LocationConfiguration.Schema = new SimpleSchema({
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  service: {
    type: String,
  },
  locations: {
    type: Array,
  },
  'locations.$': {
    type: String, // Only location id
  },
});

if (Meteor.isServer) {
  LocationConfiguration._ensureIndex(
    {
      service: 1,
    },
    {
      unique: true,
    }
  );
}

export default LocationConfiguration;
