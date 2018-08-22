import { Mongo } from "meteor/mongo";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const RazorPaySubscription = new Mongo.Collection("razorpaySubscription");

AttachBaseHooks(RazorPaySubscription);

RazorPaySubscription.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.active = true;

  doc.bc_status = 'active'
});


export default RazorPaySubscription;
