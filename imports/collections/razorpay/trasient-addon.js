import { Mongo } from "meteor/mongo";
import SimpleSchema from "simpl-schema";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const RZPTAddon = new Mongo.Collection("transientRazorpayAddons");

AttachBaseHooks(RZPTAddon);


RZPTAddon.Schema = new SimpleSchema({
  subscriptionId: {
    type: String
  },
  addOn: {
    type: {
      name: {
        type: String
      },
      description: {
        type: String
      },
      amount: {
        type: Number
      },
      currency: {
        type: String
      }
    }
  },
  userId: {
    type: String
  },
  invoiceId: {
    type: String
  },
  billingPeriodLabel: {
    type: String
  }
});

if(Meteor.isServer) {
  RZPTAddon._ensureIndex({
    invoiceId: 1
  });
}

export default RZPTAddon;
