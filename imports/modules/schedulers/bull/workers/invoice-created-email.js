import moment from 'moment';
const debug = require('debug')('scheduler:agenda:generateMonthlyBill');

module.exports = function(bullSystem) {

  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async resolve => {
      const invoices = Invoice.find({
        _id: job.data.invoiceId,
        billingPeriodLabel: moment().subtract(1, 'month').format('MMM-YYYY'),
      }).fetch();
      await Bluebird.map(invoices, async invoice => {
        console.log(`Sending invoice to ${invoice.user.email}`)
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

