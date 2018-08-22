import { Mongo } from "meteor/mongo";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const RazorPayPlan = new Mongo.Collection("razorpayPlan");

AttachBaseHooks(RazorPayPlan);

export default RazorPayPlan;
