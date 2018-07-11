import { Mongo } from 'meteor/mongo'
import SimpleSchema from 'simpl-schema';

import AttachBaseHooks from '../base-collection/attach-hooks';

const EmailVerificationCollection = new Mongo.Collection(
  "emailVerification"
);

AttachBaseHooks(EmailVerificationCollection);

EmailVerificationCollection.schema = new SimpleSchema({
  accountId: {
    type: Mongo.ObjectID
  },
  emailId: {
    type: String
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

// EmailVerificationCollection.attachSchema(EmailVerificationCollection.schema);

export const EmailVerification = EmailVerificationCollection;
