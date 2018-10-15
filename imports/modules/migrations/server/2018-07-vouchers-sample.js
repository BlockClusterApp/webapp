import Vouchers from '../../../collections/vouchers/voucher';
import moment from 'moment';
const data = require('./data/vouchers-sample');

// const insertVoucher = async (voucher) => {
//   console.log(`Creating voucher ${voucher}`);
//     Vouchers.insert({
//       code: voucher,
//       networkConfig: {
//         cpu: 0.5,
//         ram: 1,
//         disk: 5
//       },
//       expiryDate: moment().add(30 ,'days').toDate(),
//       isDiskChangeable: false,
//       discountedDays: 60,
//       claimed: false
//     });
//   return true;
// }

const deleteDummyVouchers = async vouchers => {
  console.log('deleting existing voucher');
  Vouchers.remove({
    code: { $in: vouchers },
  });

  return true;
};

Migrations.add({
  version: 3,
  up: function() {
    // const promises = [];
    // data.forEach(voucher => {
    //   promises.push(insertVoucher(voucher));
    // });
    // Promise.all(promises);
    deleteDummyVouchers(data).catch(error => {
      //log this maybe in dev server somewhere
      console.log(error);
    });
  },
  down: function() {
    Vouchers.remove({ code: { $in: vouchers } });
  },
});
