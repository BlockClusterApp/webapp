const debug = require('debug')('scheduler:bull:handleFailedBilling');
import UserFunctions from '../../../../api/server-functions/user';
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
      debug('Handling failed invoice', invoice._id);
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

      await UserFunctions.disableFunctions({ userId: invoice.userId });

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

      return resolve();
    });
  });

  bullSystem.bullJobs.process('handle-failed-billing', processFunction);
};
