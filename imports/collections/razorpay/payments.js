import { Mongo } from "meteor/mongo";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const RazorPayPayment = new Mongo.Collection("razorpayPayment");

AttachBaseHooks(RazorPayPayment);

if(!Meteor.isClient){
  RazorPayPayment._ensureIndex({
    id: 1
  }, {
    unique: true
  });
  RazorPayPayment._ensureIndex({
    email: 1
  });
  RazorPayPayment._ensureIndex({
    email: 1,
    status: 1
  });
}

export default RazorPayPayment;
