import { Mongo } from "meteor/mongo";

import SimpleSchema from "simpl-schema";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const VoucherCollection = new Mongo.Collection("vouchers");

AttachBaseHooks(VoucherCollection);

VoucherCollection.schema = new SimpleSchema(
  {
    createdAt: {
      type: Date
    },
    updatedAt: {
      type: Date
    },
    code: {
      type: String,
      required: true
    },
    expiryDate: {
      type: Date
    },
    usablity: {
      recurring: { type: Boolean }, //false means one time per user
      no_months: { type: Number }
    },
    availability: {
      for_all: { type: Boolean }, //false means available to all
      email_ids: { type: Array }
    },
    discount: {
      value: {
        type: Number
      },
      percent: {
        type: Boolean //false means consider the value as a flat amount.
      }
    },
    networkConfig: {
      type: Object
    },
    active: {
      type: Boolean
    },
    isDiskChangeable: {
      type: Boolean
    },
    discountedDays: {
      type: Number
    },
    claimed: {
      type: Boolean
    },
    claimedBy: {
      type: String
    },
    claimedOn: {
      type: Date
    }
  },
  { timesta }
);

export default VoucherCollection;
