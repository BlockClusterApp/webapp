import moment from 'moment';
import Invoice from '../../../../collections/payments/invoice';
import bullSystem from '../../bull';
const debug = require('debug')('scheduler:attach-razorpay-addons');

let uuid = '';

if (process.env.GENERATE_BILL) {
  uuid = require('uuid/v4')();
}

module.exports = function(agenda) {
  agenda.define(
    `attach-razorpay-addons${uuid}`,
    { priority: 'high' },
    Meteor.bindEnvironment(async job => {
      const billingPeriodLabel = moment()
        .subtract(1, 'month')
        .format('MMM-YYYY');
      const invoices = Invoice.find({
        billingPeriodLabel,
        rzSubscriptionId: {
          $ne: null,
        },
      }).fetch();
      debug(`Attaching razorpay to ${invoices.length} invoices | ${billingPeriodLabel}`);
      invoices.forEach(invoice => {
        bullSystem.addJob('attach-razorpay-addons', {
          invoiceId: invoice._id,
        });
      });
    })
  );

  (async () => {
    if (['staging', 'production'].includes(process.env.NODE_ENV)) {
      agenda.every('0 23 4 * *', 'attach-razorpay-addons');
    } else if (process.env.GENERATE_BILL) {
      console.log('Razorpay addons will be generated in 30 seconds');
      agenda.schedule('in 30 seconds', `attach-razorpay-addons${uuid}`);
    } else {
      agenda.every('0 23 4 * *', 'attach-razorpay-addons');
    }
  })();

};
