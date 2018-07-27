import Vouchers from '../../collections/vouchers/voucher';

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

  if(!voucher) {
    throw new Meteor.Error("Invalid or expired voucher");
  }

  return voucher;
}

Meteor.methods({
  validateVoucher: Voucher.validate
});
