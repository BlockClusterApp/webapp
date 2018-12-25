const debug = require('debug')('scheduler:bull:handleFailedBilling');
import Invoice from '../../../../collections/payments/invoice';

module.exports = function(bullSystem) {
  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async resolve => {
      const { invoiceId } = job.data;
      const invoice = Invoice.findOne({
        _id: invoiceId,
        totalAmount: {
          $gt: 0,
        },
        paymentStatus: {
          $in: [Invoice.PaymentStatusMapping.Pending, Invoice.PaymentStatusMapping.Failed],
        },
      });
      if (!invoice) {
        ElasticLogger.log('Bull - Handle failed billing', {
          invoiceId,
          status: 'Not in pending status',
        });
        return resolve();
      }

      Meteor.users.update(
        {
          _id: invoice.userId,
        },
        {
          $set: {
            paymentPending: true,
            paymentPendingForInvoiceId: invoiceId,
            paymentPendingOn: new Data(),
          },
        }
      );

      Invoice.update(
        {
          _id: invoiceId,
        },
        {
          $push: {
            paymentFailedStatus: {
              status: 'failed-warning',
              on: new Date(),
            },
          },
        }
      );
    });
  });

  bullSystem.bullJobs.process('handle-failed-billing', processFunction);
};
