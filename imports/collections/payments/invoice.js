import { Mongo } from "meteor/mongo";

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const Invoice = new Mongo.Collection("invoice");
AttachBaseHooks(Invoice);

Invoice.PaymentStatusMapping = {
  Pending: 1,
  Settled: 2,
  DemoUser: 3
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
  rzSubscriptionId: {
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

if(!Meteor.isClient) {
  Invoice._ensureIndex({
    billingPeriodLabel: 1,
    rzSubscriptionId: 1
  });
  Invoice._ensureIndex({
    rzCustomerId: 1,
    billingPeriodLabel: 1
  });
}

export default Invoice;
