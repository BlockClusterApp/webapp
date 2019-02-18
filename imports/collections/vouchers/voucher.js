import { Mongo } from 'meteor/mongo';

import SimpleSchema from 'simpl-schema';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const VoucherCollection = new Mongo.Collection('vouchers');

AttachBaseHooks(VoucherCollection);

VoucherCollection.schema = new SimpleSchema({
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  code: {
    type: String,
    required: true,
  },
  expiryDate: {
    type: Date,
  },
  usability: {
    type: {
      recurring: { type: Boolean }, //false means one time per user
      no_months: { type: Number },
      once_per_user: { type: Boolean },
      no_times_per_user: { type: Number },
    },
  },
  availability: {
    type: {
      card_vfctn_needed: { type: Boolean }, //card verification needed if true
      for_all: { type: Boolean }, //false means available to all
      email_ids: { type: Array },
    },
  },
  discount: {
    type: {
      value: {
        type: Number,
      },
      percent: {
        type: Boolean, //false means consider the value as a flat amount.
      },
    },
  },
  type: {
    type: String,
  },
  networkConfig: {
    type: Object,
  },
  active: {
    type: Boolean,
  },
  voucher_status: {
    type: Boolean,
  },
  isDiskChangeable: {
    type: Boolean,
  },
  discountedDays: {
    type: Number,
  },
  voucher_claim_status: [
    {
      type: {
        claimed: {
          type: Boolean,
        },
        claimedBy: {
          type: String,
        },
        claimedOn: {
          type: Date,
        },
      },
    },
  ],
  campaignId: {
    type: String,
  },
  hyperion: {
    type: Object,
  },
  paymeter: {
    type: Object,
  },
  locationMapping: {
    type: Object,
  },
});

if (Meteor.isServer) {
  VoucherCollection._ensureIndex({
    campaignId: 1,
  });
  VoucherCollection._ensureIndex({
    code: 1,
  });
  VoucherCollection._ensureIndex({
    type: 1,
  });
}

export default VoucherCollection;
