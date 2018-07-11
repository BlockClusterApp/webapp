import { Mongo } from 'meteor/mongo';
import AttachBaseHooks from '../base-collection/attach-hooks';
import SimpleSchema from 'simpl-schema';

const EmailSchema = new SimpleSchema({
  content: {
    type: String
  },
  to: { type: String },
  from: { type: String },
  subject: { type: String }
});

const EmailModel = new Mongo.Collection("email");

AttachBaseHooks(EmailModel);
EmailSchema.schema = EmailSchema;

// EmailModel.attachSchema(EmailSchema);

export const Email = EmailModel;