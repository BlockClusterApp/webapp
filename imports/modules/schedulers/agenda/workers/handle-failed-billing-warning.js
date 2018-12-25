import Invoice from '../../../../collections/payments/invoice';
import bull from '../../bull';
import moment from 'moment';

const debug = require('debug')('scheduler:agenda:handleFailedBilling');

let uuid = '';
if (process.env.NODE_ENV === 'development') {
  uuid = require('uuid/v4')();
}

module.exports = function(agenda) {
  const name = `handle-failed-billing${uuid.split('-')[0]}`;

  console.log('Handle failed billing task name', name);

  agenda.define(
    name,
    { priority: 'highest' },
    Meteor.bindEnvironment(job => {
      const pendingInvoices = Invoice.find({
        billingPeriodLabel: moment().format('MMM-YYYY'),
        totalAmount: {
          $gt: 0,
        },
        paymentStatus: {
          $in: [Invoice.PaymentStatusMapping.Pending, Invoice.PaymentStatusMapping.Failed],
        },
      }).fetch();
      if (!pendingInvoices[0]) {
        ElasticLogger.log('Failed Billing', { status: 'No failed invoices' });
        return true;
      }
      pendingInvoices.forEach(pi => {
        bull.addJob('handle-failed-billing', {
          invoiceId: pi._id,
        });
      });

      return true;
    })
  );

  (async () => {
    if (['staging', 'production'].includes(process.env.NODE_ENV)) {
      await agenda.every('30 0 15 *', name);
    } else if (process.env.HANDLE_FAILED_BILLING) {
      console.log('Handling failed billing in 20 seconds');
      await agenda.schedule('in 20 seconds', name);
    } else {
      await agenda.every('30 0 15 * *', name);
    }
  })();
};
