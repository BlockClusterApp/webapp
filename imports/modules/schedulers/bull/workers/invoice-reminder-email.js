import moment from 'moment';
import Invoice from '../../../../collections/payments/invoice';
import InvoiceObj from '../../../../api/billing/invoice';
const debug = require('debug')('scheduler:agenda:generateMonthlyBill');

module.exports = function(bullSystem) {
  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async resolve => {
      const invoice = Invoice.find({
        _id: job.data.invoiceId,
        paymentStatus: {
          $in: [Invoice.PaymentStatusMapping.Pending, Invoice.PaymentStatusMapping.Failed],
        },
        emailsSent: {
          $nin: [job.data.reminderCode],
        },
      }).fetch()[0];
      if (!invoice) {
        ElasticLogger.log(`Invoice email ${job.data.reminderCode} already sent`);
        return true;
      }
      ElasticLogger.log('Sending invoice pending', { invoice, reminderCode: job.data.reminderCode });
      await InvoiceObj.sendInvoicePending(invoice, job.data.reminderCode);

      return resolve();
    });
  });

  bullSystem.bullJobs.process('send-reminder-email', processFunction);
};
