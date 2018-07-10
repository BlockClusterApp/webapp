import BaseMongoCollection from "../base-collection";
import SimpleSchema from 'simpl-schema';

const EmailVerificationCollection = new BaseMongoCollection(
  "emailVerification"
);

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
