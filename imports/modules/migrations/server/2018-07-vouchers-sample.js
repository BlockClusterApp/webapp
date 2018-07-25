import Vouchers from '../../../collections/vouchers/voucher';
const data = require('./data/vouchers-sample');

Migrations.add({
  version: 3,
  up: function() {
    data.forEach(voucher => {
      console.log(`Creating voucher ${voucher.code}`);
      Vouchers.insert(voucher);
    });
  },
  down: function(){
    Vouchers.remove({});
  }
});
