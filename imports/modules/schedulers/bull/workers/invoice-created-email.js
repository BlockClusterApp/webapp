import moment from 'moment';
import Bluebird from 'bluebird';
import Invoice from '../../../../collections/payments/invoice';
import InvoiceFunctions from '../../../../api/billing/invoice';
const debug = require('debug')('scheduler:agenda:generateMonthlyBill');

module.exports = function(bullSystem) {

  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async resolve => {
      const invoices = Invoice.find({
        _id: job.data.invoiceId,
        billingPeriodLabel: moment().subtract(1, 'month').format('MMM-YYYY'),
      }).fetch();
      await Bluebird.map(invoices, async invoice => {
        ElasticLogger.log(`Sending invoice to ${invoice.user.email}`)
        await InvoiceFunctions.sendInvoiceCreatedEmail(invoice);
        return true;
      }, {
        concurrency: 10
      });

      return true;
    });
  });

  bullSystem.bullJobs.process('invoice-created-email', processFunction);
}

