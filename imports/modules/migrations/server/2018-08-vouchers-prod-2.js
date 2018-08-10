import Vouchers from '../../../collections/vouchers/voucher';
import moment from 'moment';
const data = require('./data/voucher-prod-2');

const insertVoucher = async (voucher) => {
  console.log(`Creating voucher ${voucher}`);
    Vouchers.insert({
      code: voucher,
      networkConfig: {
        cpu: 0.5,
        ram: 1,
        disk: 5
      },
      expiryDate: moment().add(30 ,'days').toDate(),
      isDiskChangeable: false,
      discountedDays: 60,
      claimed: false
    });

  return true;
}

Migrations.add({
  version: 4,
  up: function() {
    const promises = [];
    data.forEach(voucher => {
      promises.push(insertVoucher(voucher));
    });
    Promise.all(promises);
  },
  down: function(){
    Vouchers.remove({});
  }
});
