import { Mongo } from 'meteor/mongo';

import SimpleSchema from 'simpl-schema';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const VoucherCollection = new Mongo.Collection(
  "vouchers"
);

AttachBaseHooks(VoucherCollection);

VoucherCollection.schema = new SimpleSchema({
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  code: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date
  },
  networkConfig: {
    type: Object
  },
  active: {
    type: Boolean
  },
  isDiskChangeable: {
    type: Boolean
  }
});

export default VoucherCollection;
