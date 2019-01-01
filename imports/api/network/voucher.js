import Vouchers from '../../collections/vouchers/voucher';
import Billing from '../../api/billing';
import Campaign from '../../collections/vouchers/campaign';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';

import Credits from '../../collections/payments/credits';
import CreditRedemption from '../../collections/vouchers/credits-redemption';
import { Hyperion } from '../../collections/hyperion/hyperion';
import { Paymeter } from '../../collections/paymeter/paymeter';

const Voucher = {};

Voucher.getDiscountAmountForVoucher = (voucher, totalAmount) => {
  if (!voucher.discount) {
    return 0;
  }
  if (voucher.discount.percent) {
    return totalAmount * (voucher.discount.value / 100);
  }
  return Math.min(voucher.discount.value);
};

Voucher.createCampaign = async function({ description, live, expiryDate }) {
  if (!description) {
    throw new Meteor.Error('bad-request', 'Description cannot be empty');
  }

  live = live || false;
  expiryDate =
    expiryDate ||
    moment()
      .add(100, 'years')
      .toDate();

  return Campaign.insert({ description, live, expiryDate, createdBy: Meteor.userId() });
};

Voucher.applyVoucherCode = async function({ code, type, userId }) {
  const voucher = await Voucher.validate({ voucherCode: code, type, userId });

  delete voucher.voucher_claim_status;
  delete voucher.voucher_status;
  delete voucher.availability;
  delete voucher.active;
  voucher.appliedOn = new Date();

  let Model = undefined;

  if (type === 'hyperion') {
    Model = Hyperion;
  } else if (type === 'paymeter') {
    Model = Paymeter;
  }

  if (!Model) {
    throw new Meteor.Error(403, 'Invalid voucher type');
  }
  const obj = Model.find({ userId }).fetch()[0];
  if (!obj) {
    throw new Meteor.Error(400, `User not subscribed to ${Model.name}`);
  }
  if (obj.vouchers) {
    const isVoucherClaimed = obj.vouchers.find(v => voucher._id === v._id);
    if (isVoucherClaimed) {
      throw new Meteor.Error(400, 'Voucher already claimed');
    }
  }
  Model.update(
    {
      userId,
    },
    {
      $push: {
        vouchers: voucher,
      },
    }
  );

  Vouchers.update(
    {
      _id: voucher._id,
    },
    {
      $push: {
        voucher_claim_status: {
          claimed: true,
          claimedBy: userId,
          claimedOn: new Date(),
        },
      },
    }
  );

  return true;
};

Voucher.applyPromotionalCode = async function({ code, userId }) {
  userId = userId || Meteor.userId();
  const voucher = await Voucher.validate({ voucherCode: code, type: 'credit', userId });

  const previousRedemption = CreditRedemption.find({ userId, codeId: voucher._id }).fetch()[0];
  if (previousRedemption) {
    throw new Meteor.Error(403, 'Already redeemed');
  }

  // Apply code
  let redemptionId;
  let creditsId;
  try {
    redemptionId = CreditRedemption.insert({
      codeId: voucher._id,
      code,
      userId,
    });
    // Apply credits
    creditsId = Credits.insert({
      amount: voucher.discount.value,
      userId,
      code,
      metadata: {
        redemptionId,
      },
    });

    Vouchers.update(
      {
        _id: voucher._id,
      },
      {
        $push: {
          voucher_claim_status: {
            claimed: true,
            claimedBy: userId,
            claimedOn: new Date(),
          },
        },
      }
    );

    return true;
  } catch (err) {
    if (redemptionId) {
      CreditRedemption.remove({ _id: redemptionId });
    }
    if (creditsId) {
      Credits.remove({ _id: creditsId });
    }
    throw new Meteor.Error(err);
  }
};

Voucher.fetchBalanceCredits = async ({ userId }) => {
  if (!(userId === Meteor.userId() || Meteor.user().admin < 2)) {
    throw new Meteor.Error(401, 'Unauthorized');
  }

  const credits = Credits.find({ userId }).fetch();
  const balance = credits.reduce((sum, credit) => {
    const currentBalance = sum + Number(credit.amount);
    if (!credit.invoices) {
      return currentBalance;
    }
    credit.invoices.forEach(invoice => {
      currentBalance = currentBalance - Number(invoice.amount);
    });
    return currentBalance;
  }, 0);
  return Number(balance).toFixed(2);
};

Voucher.validate = async function({ voucherCode, type, userId }) {
  userId = userId || Meteor.userId();
  const user = Meteor.users.find({ _id: userId }).fetch()[0];
  const voucher = Vouchers.find({
    code: voucherCode,
    type,
    active: true,
    voucher_status: true,
    expiryDate: {
      $gt: new Date(),
    },
  }).fetch()[0];

  if (!voucher) {
    throw new Meteor.Error(400, 'Invalid voucher');
  }

  if (voucher.availability.card_vfctn_needed) {
    const card_validated = await Billing.isPaymentMethodVerified(userId);
    if (!card_validated) {
      throw new Meteor.Error('Please verify card in billing -> payments');
    }
  }
  const email_matching = voucher.availability.email_ids.indexOf(user.emails[0].address);
  const claimed_status = voucher.voucher_claim_status
    ? voucher.voucher_claim_status.filter(i => {
        return i['claimedBy'] == userId;
      })
    : 0;

  // Voucher is for specific users and current user is not eligible
  if (!voucher.availability.for_all && email_matching <= -1) {
    throw new Meteor.Error(400, 'Invalid code');
  }

  // Voucher is once per user and is already claimed by this user
  if (voucher.usability.once_per_user && claimed_status.length) {
    throw new Meteor.Error(400, 'Already Claimed');
  } else if (!voucher.usability.once_per_user && claimed_status.length == voucher.usability.no_times_per_user) {
    // Voucher can be claimed multiple times but user already claimed maximum number of times
    throw new Meteor.Error(400, 'Already Claimed');
  }
  return voucher;
};

const insertVoucher = async savable_doc => {
  return Vouchers.insert(savable_doc);
};

Voucher.create = async function(payload) {
  let voucher_codes;
  if (payload.code) {
    voucher_codes = [payload.code];
  } else {
    voucher_codes = await generateVouchers(payload.noOfVouchers, Number(payload.voucher_code_size) != NaN ? Number(payload.voucher_code_size) : 6); //lets keep it by default 6 for now
  }
  ElasticLogger.log('Voucher created', {
    payload,
    userId: Meteor.userId(),
    voucherCodes: voucher_codes,
  });
  let savabl_doc = [];
  voucher_codes.forEach(voucher => {
    const obj = {
      usability: {
        recurring: payload.usablity.recurring,
        no_months: payload.usablity.no_months || 0,
        once_per_user: payload.usablity.once_per_user,
        no_times_per_user: payload.usablity.no_times_per_user || 1,
      },
      availability: {
        card_vfctn_needed: payload.availability.card_vfctn_needed,
        for_all: payload.availability.for_all,
        email_ids: payload.availability.email_ids || [],
      },
      discount: {
        value: payload.discount.value || 0,
        percent: payload.discount.percent,
      },
      code: voucher,
      voucher_status: payload.active,
      expiryDate: payload.expiryDate
        ? new Date(payload.expiryDate)
        : moment()
            .add(30, 'days')
            .toDate(), //lets take by default 30days
      discountedDays: payload.discountedDays || payload.usablity.no_months * 30,
      voucher_claim_status: [],
      campaignId: payload.campaignId,
      type: payload.type,
    };
    if (payload.type === 'network') {
      obj.networkConfig = { cpu: payload.networkConfig.cpu, ram: payload.networkConfig.ram, disk: payload.networkConfig.disk };
      obj.metadata = {
        networkConfig: payload.networkConfig,
      };
      obj.isDiskChangeable = payload.networkConfig.isDiskChangeable;
    }
    savabl_doc.push(obj);
  });

  const promises = [];
  savabl_doc.forEach(voucher => {
    promises.push(insertVoucher(voucher));
  });
  return Promise.all(promises);
};
/**
 *
 *
 * @param {Number*} items
 * @param {Number*} size
 * @returns {Promise*}
 */
async function generateVouchers(items, size) {
  let voucherArray = [];
  let flag = 0;
  for (i = 1; i <= items; i++) {
    const codes = Math.round(Math.pow(36, size + 1) - Math.random() * Math.pow(36, size))
      .toString(36)
      .slice(1)
      .toUpperCase();
    voucherArray.push(codes);
    if (voucherArray.length + flag == items) {
      const existing_codes = Vouchers.find({ code: { $in: voucherArray } }, { fields: { code: 1 } }).fetch();
      if (existing_codes.length) {
        existing_codes.forEach(element => {
          let index = voucherArray.indexOf(element.code);
          if (index > -1) {
            voucherArray.splice(index, 1);
            items++;
            flag++;
          }
        });
      }
    }
  }
  return voucherArray;
}

Meteor.methods({
  validateVoucher: Voucher.validate,
  CreateVoucher: Voucher.create,
  createCampaign: Voucher.createCampaign,
  applyPromotionalCode: Voucher.applyPromotionalCode,
  fetchBalanceCredits: Voucher.fetchBalanceCredits,
  applyVoucherCode: Voucher.applyVoucherCode,
});

export default Voucher;
