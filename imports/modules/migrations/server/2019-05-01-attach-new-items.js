import Bluebird from 'bluebird';
import moment from 'moment';

import Invoice from '../../../collections/payments/invoice';
import Billing from '../../../api/billing';

Migrations.add({
  version: 12,
  up: async function() {
    const invoices = Invoice.find({
      billingPeriodLabel: 'Apr-2019',
      paymentStatus: 1,
    }).fetch();

    await Bluebird.map(invoices, async invoice => {
      let billingMonth = moment().subtract(1, 'month');

      const prevMonth = billingMonth.get('month');
      const prevYear = billingMonth.get('year');
      const bill = await Billing.generateBill({
        userId: invoice.userId,
        month: prevMonth,
        year: prevYear,
        isFromFrontend: true,
        skipHistory: true,
      });

      ElasticLogger.log('Updating invoice items', {
        invoiceId: invoice._id,
        totals: bill.totals,
      });

      Invoice.update(
        {
          _id: invoice._id,
        },
        {
          $set: {
            dynamos: bill.dynamos,
            privateHives: bill.privateHives,
            hyperions: bill.hyperions,
            paymeters: bill.paymeters,
            totals: bill.totals,
          },
        }
      );
    });
  },
  down: function() {},
});
