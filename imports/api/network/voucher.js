import Vouchers from "../../collections/vouchers/voucher";
import moment from "moment";

const Voucher = {};

Voucher.validate = async function(voucherCode) {
  const voucher = Vouchers.find({
    code: voucherCode,
    active: true,
    claimed: false,
    expiryDate: {
      $gt: new Date()
    }
  }).fetch()[0];

  if (!voucher) {
    throw new Meteor.Error("Invalid or expired voucher");
  }

  return voucher;
};

const insertVoucher = async savable_doc => {
  Vouchers.insert(savable_doc);
  return true;
};

/**
 * @param { voucher_code_size*, noOfVouchers*, networkConfig*, voucher_status*, expiryDate*, isDiskChangeable*, discountedDays*, claimed*, active*} payload
 * @param { cpu: Number, ram: Number, disk: Number } payload.networkConfig
 */
Voucher.create = async function(payload) {
  let voucher_codes = await generateVouchers(payload.noOfVouchers, payload.voucher_code_size); //lets keep it by default 6 for now
  let savabl_doc = [];
  voucher_codes.forEach(voucher => {
    savabl_doc.push({
      usablity: {
        recurring: payload.usablity.recurring || false,
        no_months: payload.usablity.no_months || 0
      },
      availability: {
        for_all: payload.availability.for_all || false,
        email_ids: payload.availability.email_ids || []
      },
      discount: {
        value: payload.discount.value || 0,
        percent: payload.discount.value || false
      },
      code: voucher,
      active:payload.voucher_status || true,
      networkConfig: payload.networkConfig,
      expiryDate: payload.expiryDate
        ? new Date(payload.expiryDate)
        : moment()
            .add(30, "days")
            .toDate(), //lets take by default 30days
      isDiskChangeable: payload.isDiskChangeable || false,
      discountedDays: payload.discountedDays || 0,
      claimed: payload.claimed || false
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
function generateVouchers(items, size) {
  let voucherArray = [];
  return new Promise((resolve, reject) => {
    let flag = 0;
    for (i = 1; i <= items; i++) {
      console.log(i);
      voucherArray.push(
        Math.round(Math.pow(36, size + 1) - Math.random() * Math.pow(36, size))
          .toString(36)
          .slice(1)
          .toUpperCase()
      );
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
        } else {
          return resolve(voucherArray);
        }
      }
    }
    return resolve(voucherArray);
  });
}

Meteor.methods({
  validateVoucher: Voucher.validate,
  CreateVoucher: Voucher.create
});
