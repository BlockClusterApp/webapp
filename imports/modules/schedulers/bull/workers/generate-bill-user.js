import Billing from '../../../../api/billing';
import Invoice from '../../../../api/billing/invoice';
import moment from 'moment';
import { RZPlan, RZSubscription } from '../../../../collections/razorpay';
import { Hyperion } from '../../../../collections/hyperion/hyperion.js';
import helpers from "../../../../modules/helpers"

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

      let billingMonth = moment().subtract('1', 'month');
      // if(process.env.GENERATE_BILL) {
      //   billingMonth = moment().;
      // }
      const prevMonth = billingMonth.get('month');
      const prevYear = billingMonth.get('year');
      const bill = await Billing.generateBill({
        userId,
        month: prevMonth,
        year: prevYear
      });
      debug('Bill', bill);


      /*Calculate Hyperion Usage Bill*/
      //start
      let total_hyperion_cost = 0; //add this value to invoice amount
      let hyperion_stats = Hyperion.find({
        userId: userId
      }).fetch();

      if(hyperion_stats.length === 1) {
        let totalDaysThisMonth = helpers.daysInThisMonth();
        let costPerGBPerDay = helpers.hyperionGBCostPerDay();
        let fileSizeInGB = ((hyperion_stats[0].size / 1024) / 1024) / 1024;
        let fileCostPerDay = costPerGBPerDay * fileSizeInGB;
        total_hyperion_cost = totalDaysThisMonth * fileCostPerDay;
        total_hyperion_cost = (total_hyperion_cost - hyperion_stats[0].discout).toPrecision(2);

        Hyperion.update({
          userId: userId
        }, {
          $set: {
            discount: 0 //reset discount
          }
        })
      }
      //end

      const rzSubscription = RZSubscription.find({
        userId,
        plan_id: plan.id,
        bc_status: 'active'
      }).fetch()[0];

      const invoiceId = await Invoice.generateInvoice({
        userId,
        billingMonth: billingMonth.toDate(),
        bill,
        rzSubscription
      });


      // if(!rzSubscription) {
      //   console.log("Subscription not found", userId, plan.id);
      //   return resolve(false);
      // }

      return resolve(invoiceId);
    });
  }

  bullSystem.bullJobs.process('generate-bill-user', CONCURRENCY, processFunction);
}
