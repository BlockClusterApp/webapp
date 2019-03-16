import Invoice from '../../../../collections/payments/invoice';
import Razorpay from '../../../../api/payments/payment-gateways/razorpay';
import RZPTAddon from '../../../../collections/razorpay/trasient-addon';
import Bluebird from 'bluebird';

const debug = require('debug')('scheduler:bull:attach-razorpay-addons');

const CONCURRENCY = 5;

module.exports = bullSystem => {
  const processFunction = job => {
    return new Promise(async resolve => {
      const { invoiceId } = job.data;

      const invoice = Invoice.find({
        _id: invoiceId,
        rzAddOnId: null,
        paymentStatus: {
          $in: [Invoice.PaymentStatusMapping.Pending],
        },
      }).fetch()[0];
      debug('Attaching addon to ', invoiceId);
      if (!invoice) {
        ElasticLogger.log(`Invoice already has razorpay addon attached. Cannot attach again`, {
          invoiceId,
        });
        return resolve();
      }

      ElasticLogger.log(`Attaching addons`, {
        invoiceId: invoice._id,
        billingPeriodLabel: invoice.billingPeriodLabel,
        totalAmount: invoice.totalAmountINR,
        status: invoice.paymentStatus,
      });

      const addons = RZPTAddon.find({ invoiceId: invoice._id, subscriptionId: invoice.rzSubscriptionId }).fetch();
      if (addons && addons.length <= 0) {
        ElasticLogger.log('No transient razorpay addons', {
          invoiceId: invoice._id,
          subscriptionId: invoice.rzSubscriptionId,
        });
        return resolve();
      }

      const addOns = [];
      await Bluebird.map(
        addons,
        async addon => {
          const rzAddOn = await Razorpay.createAddOn({
            subscriptionId: invoice.rzSubscriptionId,
            addOn: {
              name: addon.addOn.name,
              description: addon.addOn.description,
              amount: addon.addOn.amount,
              currency: 'INR',
            },
            userId: invoice.userId,
          });
          addOns.push(rzAddOn);
          return true;
        },
        {
          concurrency: 2,
        }
      );

      // const totalAmount = addons.reduce((total, addon) => !console.log(addon.addOn) && total + Number(addon.addOn.amount), 0);

      // if (totalAmount <= 100) {
      //   ElasticLogger.log(`Amount < 100`, {
      //     totalAmount,
      //     invoiceId: invoice._id,
      //     userId: invoice.userId,
      //   });
      //   Invoice.update(
      //     { _id: invoice._id },
      //     {
      //       $set: {
      //         paymentStatus: Invoice.PaymentStatusMapping.Settled,
      //       },
      //     }
      //   );
      //   return resolve();
      // }

      ElasticLogger.log('Updating invoice with addon', {
        invoiceId,
        userId: invoice.userId,
        rzAddon: addOns.map(a => a._id),
      });
      Invoice.update(
        { _id: invoice._id },
        {
          $set: {
            rzAddOnId: addOns.map(a => a._id),
          },
        }
      );

      addons.forEach(addon => {
        RZPTAddon.update(
          {
            _id: addon._id,
          },
          {
            $set: {
              active: false,
            },
          }
        );
      });

      return resolve(invoiceId);
    });
  };

  bullSystem.bullJobs.process('attach-razorpay-addons', CONCURRENCY, processFunction);
};
