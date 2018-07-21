import { Mongo } from "meteor/mongo";

const AttachModelHooks = require("../../modules/helpers/model-helpers");

const PaymentRequests = new Mongo.Collection("paymentRequests");

AttachModelHooks(PaymentRequests);

PaymentRequests.paymentGateways = {
    RazorPay: 'RazorPay'
};


PaymentRequests.before.insert((userId, doc) => {
    doc.createdAt = new Date();
    doc.active = true;

    if(!doc.paymentGateway) {
        throw new Error("Payment gateway required for payment request");
    }
    if(!Object.values(PaymentRequests.paymentRequests).includes(doc.paymentGateway)) {
        throw new Error(`${doc.paymentGateway} is not a valid payment gateway.`)
    }
});

PaymentRequests.StatusMapping = {
    Pending: 1,
    Approved: 2,
    Refunded: 3
}

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
  }
});

export default PaymentRequests;