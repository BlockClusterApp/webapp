import { Mongo } from "meteor/mongo";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const RazorPayPlan = new Mongo.Collection("razorpayPlan");

AttachBaseHooks(RazorPayPlan);

if(!Meteor.isClient) {
  RazorPayPlan._ensureIndex({
    id: 1
  }, {
    unique: true
  });
  RazorPayPlan._ensureIndex({
    identifier: 1
  }, {
    unique: true
  });
}



export default RazorPayPlan;
