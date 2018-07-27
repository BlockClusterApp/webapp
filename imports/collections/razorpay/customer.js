import { Mongo } from "meteor/mongo";

const AttachModelHooks = require("../../modules/helpers/model-helpers");

const RZPCustomer = new Mongo.Collection("razorpay_customer");
AttachModelHooks(RZPCustomer);

RZPCustomer.schema = new SimpleSchema({
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  userId: {
    type: String
  }
});

export default RZPCustomer;