import { Mongo } from 'meteor/mongo';

import SimpleSchema from 'simpl-schema';

import AttachBaseHooks from '../../modules/helpers/model-helpers';
import moment from 'moment';

const Campaign = new Mongo.Collection('campaign');

AttachBaseHooks(Campaign);

Campaign.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  if (!doc.hasOwnProperty('active')) {
    doc.active = true;
  }
  if (!doc.hasOwnProperty('live')) {
    doc.live = true;
  }
  if (!doc.expiryDate) {
    doc.expiryDate = moment()
      .add(100, 'years')
      .toDate();
  }
});

Campaign.schema = new SimpleSchema({
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  expiryDate: {
    type: Date,
  },
  active: {
    type: Boolean,
  },
  deletedBy: {
    type: String,
  },
  deletedAt: {
    type: Date,
  },
  live: {
    type: Boolean,
  },
  description: {
    type: String,
  },
});

export default Campaign;
