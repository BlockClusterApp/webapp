import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import AttachBaseHooks from '../../modules/helpers/model-helpers';

const WebHook = new Mongo.Collection('webhooks');

AttachBaseHooks(WebHook);

WebHook.StatusMapping = {
  Pending: 1,
  Sent: 2,
  Failed: 3,
  Error: 4,
};

WebHook.Schema = new SimpleSchema({
  id: {
    type: String,
  },
  url: {
    type: String,
  },
  response: {
    type: Object,
  },
  payload: {
    type: Object,
  },
  userId: {
    type: String,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  status: {
    type: Number,
  },
  retries: {
    type: Number,
  },
});

export default WebHook;
