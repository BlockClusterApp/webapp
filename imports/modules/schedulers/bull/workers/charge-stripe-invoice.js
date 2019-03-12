import Invoice from '../../../../collections/payments/invoice';
import Stripe from '../../../../api/payments/payment-gateways/stripe';

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

      ElasticLogger.log(`Charging Stripe invoice`, {
        invoiceId: invoice._id,
        billingPeriodLabel: invoice.billingPeriodLabel,
        totalAmount: invoice.totalAmount,
        status: invoice.paymentStatus,
      });

      const result = await Stripe.chargeCustomer({
        customerId: invoice.stripeCustomerId,
        amountInDollars: invoice.totalAmount,
        idempotencyKey: invoice._id,
        description: `Bill for ${invoice.billingPeriodLabel}`,
      });

      debug('Stripe charge result', result);

      ElasticLogger.log('Strip payment charged', {
        result,
        invoiceId,
      });

      return resolve(invoiceId);
    });
  };

  bullSystem.bullJobs.process('charge-stripe-invoice', CONCURRENCY, processFunction);
};
