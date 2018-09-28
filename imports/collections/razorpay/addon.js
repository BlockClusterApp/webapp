import { Mongo } from "meteor/mongo";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const RazorPayAddOn = new Mongo.Collection("razorpayAddOn");

AttachBaseHooks(RazorPayAddOn);

if(!Meteor.isClient) {
  RazorPayAddOn._ensureIndex({
    id: 1
  }, {
    unique: true
  });
}

export default RazorPayAddOn;
