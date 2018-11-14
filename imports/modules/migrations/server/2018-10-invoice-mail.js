import Invoice from '../../../collections/payments/invoice';
import InvoiceFunctions from '../../../api/billing/invoice';
import Bluebird from 'bluebird';

Migrations.add({
  version: 9,
  up: async function() {
    // const invoices = Invoice.find({
    //   paymentStatus: Invoice.PaymentStatusMapping.Pending,
    //   billingPeriodLabel: 'Sep-2018',
    //   totalAmountINR: {
    //     $gt: 0,
    //   },
    //   emailsSent: {
    //     $nin: [Invoice.EmailMapping.Created],
    //   },
    // }).fetch();
    // await Bluebird.map(invoices, async invoice => {
    //   console.log(`Sending invoice to ${invoice.user.email}`)
    //   await InvoiceFunctions.sendInvoiceCreatedEmail(invoice);
    //   return true;
    // }, {
    //   concurrency: 10
    // });

    return true;
  },
  down: function() {
    // Invoice.update({}, {
    //   $unset: {
    //     emailsSent: ''
    //   }
    // })
  },
});
