import Invoice from '../../../../collections/payments/invoice';
import bull from '../../bull';
import moment from 'moment';

const debug = require('debug')('scheduler:agenda:delete-user-data');

let uuid = '';
if (process.env.NODE_ENV === 'development') {
  uuid = require('uuid/v4')();
}

module.exports = function(agenda) {
  const name = `delete-user-data${uuid.split('-')[0]}`;

  console.log('Delete user data task name', name);

  agenda.define(
    name,
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
        ElasticLogger.log('Delete user data', { status: 'No eligible users' });
        return true;
      }
      pendingInvoices.forEach(pi => {
        debug('Deleting user data for ', { invoiceId: pi.invoiceId });
        bull.addJob('delete-user-data', {
          invoiceId: pi._id,
          userId: pi.userId,
        });
      });

      return true;
    })
  );

  (async () => {
    // if (['staging', 'production'].includes(process.env.NODE_ENV)) {
    await agenda.every('30 0 30 * *', name);
    // }
  })();
};
