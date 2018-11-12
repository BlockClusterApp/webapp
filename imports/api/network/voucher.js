import Vouchers from "../../collections/vouchers/voucher";
import Billing from '../../api/billing';
import moment from "moment";
import { Meteor } from 'meteor/meteor';

const Voucher = {};

Voucher.validate = async function(voucherCode) {
  const voucher = Vouchers.find({
    code: voucherCode,
    active: true,
    voucher_status:true,
    expiryDate: {
      $gt: new Date()
    }
  }).fetch()[0];

  if (!voucher) {
    throw new Meteor.Error("Invalid or expired voucher");
  }
  const card_validated= await Billing.isPaymentMethodVerified(Meteor.userId());
  if(voucher.availability.card_vfctn_needed && !card_validated){
    throw new Meteor.Error("Please verify card in billing>payments");
  }
  const email_matching = voucher.availability.email_ids.indexOf(Meteor.user().emails[0].address);
  const claimed_status = voucher.voucher_claim_status ? (voucher.voucher_claim_status.filter((i)=>{return i["claimedBy"] == Meteor.userId()})) :0

  if(!voucher.availability.for_all && email_matching <= -1){
    throw new Meteor.Error("Voucher is not eligible for your Email.");
  }
  if(voucher.usability.once_per_user && claimed_status.length){
    throw new Meteor.Error("already claimed");
  }else if(!voucher.usability.once_per_user && (claimed_status.length==voucher.usability.no_times_per_user)){
    throw new Meteor.Error("Use Limit Exceed");
  }
  return voucher;
};

const insertVoucher = async savable_doc => {
  return Vouchers.insert(savable_doc);
};

/**
 * @param { voucher_code_size*, noOfVouchers*, networkConfig*, active*, expiryDate*, isDiskChangeable*, discountedDays*, claimed*} payload
 * @param { cpu: Number, ram: Number, disk: Number } payload.networkConfig
 */
Voucher.create = async function(payload) {
  let voucher_codes;
  if(payload.code){
    voucher_codes = [payload.code];
  }else{
  voucher_codes = await generateVouchers(payload.noOfVouchers, Number(payload.voucher_code_size)!= NaN ? Number(payload.voucher_code_size) :6 ); //lets keep it by default 6 for now
  }
  ElasticLogger.log("Voucher created", {
    payload,
    userId: Meteor.userId(),
    voucherCodes: voucher_codes
  });
  let savabl_doc = [];
  voucher_codes.forEach(voucher => {
    savabl_doc.push({
      usability: {
        recurring: payload.usablity.recurring,
        no_months: payload.usablity.no_months || 0,
        once_per_user:payload.usablity.once_per_user,
        no_times_per_user:payload.usablity.no_times_per_user || 1
      },
      availability: {
        card_vfctn_needed:payload.availability.card_vfctn_needed ,
        for_all: payload.availability.for_all ,
        email_ids: payload.availability.email_ids || []
      },
      discount: {
        value: payload.discount.value || 0,
        percent: payload.discount.percent
      },
      code: voucher,
      voucher_status: payload.active,
      networkConfig: payload.networkConfig,
      expiryDate: payload.expiryDate
        ? new Date(payload.expiryDate)
        : moment()
            .add(30, "days")
            .toDate(), //lets take by default 30days
      isDiskChangeable: payload.isDiskChangeable ,
      discountedDays: payload.discountedDays || 0,
      voucher_claim_status:[]
    });
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
          .toUpperCase()
      voucherArray.push(codes);
      if (voucherArray.length + flag == items) {
        const existing_codes = Vouchers.find(
          { code: { $in: voucherArray } },
          { fields: { code: 1 } }
        ).fetch();
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
  CreateVoucher: Voucher.create
});
