import { Mongo } from 'meteor/mongo'
import SimpleSchema from 'simpl-schema';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const PasswordResetCollection = new Mongo.Collection(
  "passwordResetRequest"
);

AttachBaseHooks(PasswordResetCollection);

PasswordResetCollection.schema = new SimpleSchema({
  accountId: {
    type: Mongo.ObjectID
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  uniqueToken: {
    type: String
  },
  active: {
    type: Boolean
  }
});


export const PasswordResetRequest = PasswordResetCollection;
