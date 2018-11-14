import Vouchers from '../../../collections/vouchers/voucher';
const data = require('./data/voucher-prod-2');

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
  version: 10,
  up: function() {
    // Promise.all([deleteDummyVouchers(data), updateGivenDetails(voucherToUpdate)]);
  },
  down: function() {
    // Vouchers.remove({});
  },
});
