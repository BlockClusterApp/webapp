import { Mongo } from 'meteor/mongo';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const Invoice = new Mongo.Collection('invoice');
AttachBaseHooks(Invoice);

Invoice.PaymentStatusMapping = {
  Pending: 1,
  Settled: 2,
  Paid: 2,
  DemoUser: 3,
  Failed: 4,
  WaivedOff: 5,
  Refunded: 6,
  OfflineUser: 7,
  Transient: 8, // Addon attached but invoice for next cycle. Show this as unpaid in customer dashboard
};

Invoice.EmailMapping = {
  Created: 1,
  Reminder1: 2,
  Reminder2: 3,
  NodeDeletion: 4,
};

Invoice.schema = new SimpleSchema({
  user: {
    type: {
      email: String,
      mobile: String,
      name: String,
      billingAddress: String,
    },
  },
  items: {
    type: Array,
  },
  'items.$': {
    type: Object,
  },
  rzCustomerId: {
    type: Array,
  },
  'rzCustomerId.$': {
    type: String,
  },
  rzSubscriptionId: {
    type: String,
  },
  stripeCustomerId: {
    type: String,
  },
  totalAmount: {
    // Amount after applying credits
    type: Number,
  },
  billingAmount: {
    // Total bill
    type: Number,
  },
  rzAddOnId: {
    type: String,
  },
  paymentStatus: {
    type: Number,
  },
  billingPeriod: {
    type: Date,
  },
  billingPeriodLabel: {
    type: String,
  },
  emailsSent: {
    type: Array,
  },
  'emailsSent.$': {
    type: Number,
  },
  creditClaims: {
    type: Array,
  },
  'creditClaims.$': {
    type: {
      id: {
        type: String,
      },
      amount: {
        type: Number,
      },
    },
  },
  paymentLink: {
    type: {
      id: {
        type: String,
      },
      link: {
        type: String,
      },
      expired: {
        type: Boolean,
      },
    },
  },
  userId: {
    type: String,
  },
  paymentFailedStatus: {
    type: Array,
  },
  'paymentFailedStatus.$': {
    type: {
      status: {
        type: String,
      },
      on: {
        type: Date,
      },
    },
  },
  previousPendingInvoiceIds: {
    type: Array,
  },
  'previousPendingInvoiceIds.$': {
    type: String,
  },
});

if (!Meteor.isClient) {
  Invoice._ensureIndex({
    billingPeriodLabel: 1,
    rzSubscriptionId: 1,
  });
  Invoice._ensureIndex({
    rzCustomerId: 1,
    billingPeriodLabel: 1,
  });
}

export default Invoice;
