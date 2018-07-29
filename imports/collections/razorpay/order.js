import { Mongo } from "meteor/mongo";

const AttachModelHooks = require("../../modules/helpers/model-helpers");

const RZPOrder = new Mongo.Collection("razorpay_order");
AttachModelHooks(RZPOrder);

RZPOrder.schema = new SimpleSchema({
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

export default RZPOrder;