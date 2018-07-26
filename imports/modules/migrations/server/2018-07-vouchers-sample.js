import Vouchers from '../../../collections/vouchers/voucher';
const data = require('./data/vouchers-sample');

Migrations.add({
  version: 3,
  up: function() {
    data.forEach(voucher => {
      console.log(`Creating voucher ${voucher}`);
      Vouchers.insert({
        code: voucher,
        networkConfig: {
          cpu: 0.5,
          ram: 0.5,
          disk: 5
        },
        isDiskChangeable: false,
        discountedDays: 60
      });
    });
  },
  down: function(){
    Vouchers.remove({});
  }
});
