import BaseMongoCollection from "../base-collection";

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
  },
  messageId: { type: String }
});

EmailVerificationCollection.attachSchema(EmailVerificationCollection.schema);

export const EmailVerification = EmailVerificationCollection;
