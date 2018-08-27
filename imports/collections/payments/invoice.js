import { Mongo } from "meteor/mongo";

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const Invoice = new Mongo.Collection("invoice");
AttachBaseHooks(Invoice);

Invoice.PaymentStatusMapping = {
  Pending: 1,
  Success: 2
};

Invoice.schema = new SimpleSchema({
  user: {
    type: {
      email: String,
      mobile: String,
      name: String,
      billingAddress: String,
    }
  },
  items: {
    type: Array
  },
  "items.$": {
    type: Object
  },
  rzCustomerId: {
    type: Array
  },
  "rzCustomerId.$": {
    type: String
  },
  totalAmount: {
    type: Number
  },
  rzAddOnId: {
    type: String
  },
  paymentStatus: {
    type: Number
  },
  billingPeriod: {
    type: Date
  },
  billingPeriodLabel: {
    type: String
  }
});

export default Invoice;
