import moment from 'moment';
import Invoice from '../../../../collections/payments/invoice';
import bullSystem from '../../bull';
const debug = require('debug')('scheduler:agenda:charge-stripe-invoices');

let uuid = '';

if (process.env.GENERATE_BILL) {
  uuid = require('uuid/v4')();
}

module.exports = function(agenda) {
  agenda.define(
    `charge-stripe-invoice${uuid}`,
    { priority: 'high' },
    Meteor.bindEnvironment(async job => {
      const billingPeriodLabel = moment()
        .subtract(1, 'month')
        .format('MMM-YYYY');
      const invoices = Invoice.find({
        billingPeriodLabel,
        stripeCustomerId: {
          $exists: true,
        },
      }).fetch();
      debug(`Charging stripe to ${invoices.length} invoices | ${billingPeriodLabel}`);
      invoices.forEach(invoice => {
        bullSystem.addJob('charge-stripe-invoice', {
          invoiceId: invoice._id,
        });
      });
    })
  );

  (async () => {
    if (['staging', 'production'].includes(process.env.NODE_ENV)) {
      agenda.every('0 1 5 * *', 'charge-stripe-invoice');
    } else if (process.env.GENERATE_BILL) {
      console.log('Stripe invoices will be charged in 30 seconds');
      agenda.schedule('in 30 seconds', `charge-stripe-invoice${uuid}`);
    } else {
      agenda.every('0 1 5 * *', 'charge-stripe-invoice');
    }
  })();
};
