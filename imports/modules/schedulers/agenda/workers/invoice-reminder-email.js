import Invoice from '../../../../collections/payments/invoice';
import moment from 'moment';
import bull from '../../bull';
import { RZSubscription, RZPlan } from '../../../../collections/razorpay';
import RazorPaySubscription from '../../../../collections/razorpay/subscription';
const debug = require('debug')('scheduler:agenda:generateMonthlyBill');

module.exports = function(agenda) {
  agenda.define(
    'invoice-reminder-email',
    { priority: 'highest' },
    Meteor.bindEnvironment(job => {

      const billingMonthLabel = moment()
        .subtract(1, 'month')
        .format('MMM-YYYY');

      const reminderCode = moment().get('date') <= 5 ? Invoice.PaymentStatusMapping.Reminder1 : Invoice.PaymentStatusMapping.Reminder2;
      const pendingInvoices = Invoice.find({
        billingMonthLabel,
        totalAmount: {
          $gt: 0
        },
        paymentStatus: {
          $in: [Invoice.PaymentStatusMapping.Pending, Invoice.PaymentStatusMapping.Failed],
        },
        emailsSend: {
          $in: [Invoice.EmailMapping.Created],
        },
      }).fetch();
      const userInvoiceMapping = {};
      pendingInvoices.forEach(i => {
        userInvoiceMapping[i.userId] = i._id;
      });
      let users = [];

      ElasticLogger.log("Invoice reminder", {mapping: userInvoiceMapping});
      if (moment().get('date') <= 5) {
        const verificationPlan = RZPlan.find({
          identifier: 'verification',
        }).fetch()[0];
        const subscriptions = RazorPaySubscription.find({
          plan_id: verificationPlan.id,
        })
          .fetch()
          .map(s => s.userId);

        users = Meteor.users
          .find({
            _id: {
              $in: pendingInvoices.map(i => i.userId),
              $nin: subscriptions,
            },
          })
          .fetch();
      } else {
        users = Meteor.users
          .find({
            _id: {
              $in: pendingInvoices.map(i => i.userId),
            },
          })
          .fetch();
      }
      users.forEach(user => {
        bull.addJob(
          'send-reminder-email',
          {
            invoiceId: userInvoiceMapping[user._id],
            reminderCode,
          },
          {
            attempts: 3,
          }
        );
      });
    })
  );

  if (['staging', 'production'].includes(process.env.NODE_ENV)) {
    agenda.every('0 6 4,8 * *', 'invoice-reminder-email');
  }
};
