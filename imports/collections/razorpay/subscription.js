import { Mongo } from "meteor/mongo";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const RazorPaySubscription = new Mongo.Collection("razorpaySubscription");

AttachBaseHooks(RazorPaySubscription);

RazorPaySubscription.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.active = true;

  doc.bc_status = 'pending'
});


if(!Meteor.isClient) {
  RazorPaySubscription._ensureIndex({
    id: 1
  });
  RazorPaySubscription._ensureIndex({
    userId: 1
  });
  RazorPaySubscription._ensureIndex({
    userId: 1,
    plan_id: 1
  });
}


export default RazorPaySubscription;
