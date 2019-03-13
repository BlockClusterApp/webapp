import Invoice from '../../../../collections/payments/invoice';
import Stripe from '../../../../api/payments/payment-gateways/stripe';
import InvoiceObj from '../../../../api/billing/invoice';

const debug = require('debug')('scheduler:bull:charge-stripe-users');

const CONCURRENCY = 5;

module.exports = bullSystem => {
  const processFunction = job => {
    return new Promise(async resolve => {
      const { invoiceId } = job.data;

      const invoice = Invoice.find({
        _id: invoiceId,
        paymentStatus: {
          $in: [Invoice.PaymentStatusMapping.Pending, Invoice.PaymentStatusMapping.Failed],
        },
        stripeCustomerId: {
          $exists: true,
        },
      }).fetch()[0];
      if (!invoice) {
        ElasticLogger.log(`Not a valid chargeable stripe invoice`, {
          invoiceId,
        });
        return resolve();
      }

      await InvoiceObj.adminChargeStripeInvoice({ invoiceId: invoice._id, adminUserId: 'system' });

      return resolve(invoiceId);
    });
  };

  bullSystem.bullJobs.process('charge-stripe-invoice', CONCURRENCY, processFunction);
};
