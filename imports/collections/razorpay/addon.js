import { Mongo } from "meteor/mongo";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const RazorPayAddOn = new Mongo.Collection("razorpayAddOn");

AttachBaseHooks(RazorPayAddOn);

export default RazorPayAddOn;
