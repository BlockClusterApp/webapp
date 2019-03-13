import Billing from '../../../../api/billing';
import Invoice from '../../../../api/billing/invoice';
import moment from 'moment';
import { RZPlan, RZSubscription } from '../../../../collections/razorpay';
import StripeCustomer from '../../../../collections/stripe/customer';

const debug = require('debug')('scheduler:bull:bill');

const CONCURRENCY = 5;

module.exports = bullSystem => {
  const processFunction = job => {
    return new Promise(async resolve => {
      const plan = RZPlan.find({
        identifier: 'verification',
      }).fetch()[0];

      const { userId } = job.data;
      debug('Generating invoice for ', userId);

      let billingMonth = moment().subtract(1, 'month');
      if (process.env.GENERATE_BILL) {
        // billingMonth = moment().subtract(1, 'month');
      }
      const prevMonth = billingMonth.get('month');
      const prevYear = billingMonth.get('year');
      const bill = await Billing.generateBill({
        userId,
        month: prevMonth,
        year: prevYear,
      });
      debug('Bill', bill);

      const user = Meteor.users.find({ _id: userId }).fetch()[0];

      if (!user) {
        ElasticLogger.log('Invoice generate userId invalid', { userId });
        return true;
      }

      let rzSubscription;
      let stripeCustomer;
      if (user.stripeCustomerId) {
        stripeCustomer = StripeCustomer.find({ id: user.stripeCustomerId }).fetch()[0];
      } else {
        rzSubscription = RZSubscription.find({
          userId,
          plan_id: plan.id,
          bc_status: 'active',
        }).fetch()[0];
      }

      const invoiceId = await Invoice.generateInvoice({
        userId,
        billingMonth: billingMonth.toDate(),
        bill,
        rzSubscription,
        stripeCustomer,
      });

      ElasticLogger.log('Invoice generated', {
        billingMonth: billingMonth.format('MMM-YYYY'),
        userId,
        rzSubscription: rzSubscription && rzSubscription._id,
        stripeCustomerId: user.stripCustomerId,
        invoiceId,
      });

      // if(!rzSubscription) {
      //   console.log("Subscription not found", userId, plan.id);
      //   return resolve(false);
      // }

      return resolve(invoiceId);
    });
  };

  bullSystem.bullJobs.process('generate-bill-user', CONCURRENCY, processFunction);
};
