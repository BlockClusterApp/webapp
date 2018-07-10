import BaseMongoCollection from "../base-collection";
import SimpleSchema from 'simpl-schema';

const EmailSchema = new SimpleSchema({
  content: {
    type: String
  },
  to: { type: String },
  from: { type: String },
  subject: { type: String }
});

const EmailModel = new BaseMongoCollection("Email");

// EmailModel.attachSchema(EmailSchema);

export const Email = EmailModel;