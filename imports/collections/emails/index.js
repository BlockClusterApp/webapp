import { Mongo } from 'meteor/mongo';
import AttachBaseHooks from '../../modules/helpers/model-helpers';
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