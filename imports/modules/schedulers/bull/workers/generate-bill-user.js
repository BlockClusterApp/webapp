import Billing from '../../../../api/billing';
import Invoice from '../../../../api/billing/invoice';
import moment from 'moment';
import { RZPlan, RZSubscription } from '../../../../collections/razorpay';

const debug = require('debug')('scheduler:bull:bill');

const CONCURRENCY = 5;

module.exports = (bullSystem) => {

  const processFunction = (job) => {
    return new Promise(async resolve => {

      const plan = RZPlan.find({
        identifier: 'verification'
      }).fetch()[0];

      const { userId } = job.data;
      debug("Generating invoice for ", userId);
      const billingMonth = moment().subtract('1', 'month');
      const prevMonth = billingMonth.get('month');
      const prevYear = billingMonth.get('year');
      const bill = await Billing.generateBill({
        userId,
        month: prevMonth,
        year: prevYear
      });
      debug('Bill', bill);

      const rzSubscription = RZSubscription.find({
        userId,
        plan_id: plan.id
      }).fetch()[0];

      if(!rzSubscription) {
        console.log("Subscription not found", userId, plan.id);
        return resolve(false);
      }

      const invoiceId = await Invoice.generateInvoice({
        userId,
        billingMonth: billingMonth.toDate(),
        bill,
        rzSubscription
      });

      return resolve(invoiceId);
    });
  }

  bullSystem.bullJobs.process('generate-bill-user', CONCURRENCY, processFunction);
}
