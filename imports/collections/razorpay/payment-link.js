import { Mongo } from "meteor/mongo";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const RazorPayPaymentLink = new Mongo.Collection("razorpayPaymentLink");

AttachBaseHooks(RazorPayPaymentLink);

if(!Meteor.isClient) {
  RazorPayPaymentLink._ensureIndex({
    id: 1
  });
  RazorPayPaymentLink._ensureIndex({
    userId: 1
  });
}


export default RazorPayPaymentLink;
