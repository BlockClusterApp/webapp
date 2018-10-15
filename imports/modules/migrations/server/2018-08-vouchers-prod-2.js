import Vouchers from '../../../collections/vouchers/voucher';
import moment from 'moment';
const data = require('./data/voucher-prod-2');

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

const voucherToUpdate = ['R7T552RU', 'X4ZQOFR9', 'X25UPRDM', 'O8XWYQTZ', '7CER1W5R', 'LBLEDF9T', 'UWCQYTJG', 'IC5YQR0I', 'O1IVDKBI', 'HIUU13D8'];

const updateGivenDetails = async(voucherToUpdate)=>{
  Vouchers.update({code:{$in:voucherToUpdate}},{
    'discount.percent':false
  },{multi:true});
  return true;
};
Migrations.add({
  version: 4,
  up: function() {
    // data.forEach(voucher => {
    //   promises.push(insertVoucher(voucher));
    // });
    // Promise.all(promises);
    Promise.all([deleteDummyVouchers(data), updateGivenDetails(voucherToUpdate)]);
  },
  down: function() {
    Vouchers.remove({ code: { $in: data } });
  },
});
