import { Mongo } from "meteor/mongo";

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const PaymentRequests = new Mongo.Collection("paymentRequests");

AttachBaseHooks(PaymentRequests);

PaymentRequests.paymentGateways = {
    RazorPay: 'razorpay'
};


PaymentRequests.StatusMapping = {
    Pending: 1,
    Approved: 2,
    Refunded: 3
}

PaymentRequests.before.insert((userId, doc) => {
    doc.createdAt = new Date();
    doc.active = true;

    if(!doc.userId) {
        throw new Error("Payment requests should belong to a user");
    }

    if(!doc.paymentGateway) {
        throw new Error("Payment gateway required for payment request");
    }
    if(!Object.values(PaymentRequests.paymentGateways).includes(doc.paymentGateway)) {
        throw new Error(`${doc.paymentGateway} is not a valid payment gateway.`)
    }

    doc.paymentStatus = PaymentRequests.StatusMapping.Pending;
});

PaymentRequests.schema = new SimpleSchema({
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  userId: {
    type: String
  },
  paymentGateway: {
      type: String
  },
  paymentStatus: {
    type: Number
  },
  amount: {
    type: Number
  },
  pgReference: {
    type: String
  },
  pgResponse: {
    type: Array
  },
  "pgResponse.$": {
    type: Object
  },
  refundedAt: {
    type: Date
  }
});

export default PaymentRequests;
