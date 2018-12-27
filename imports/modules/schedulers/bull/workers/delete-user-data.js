import Invoice from '../../../../collections/payments/invoice';
import User from '../../../../api/server-functions/user';

const debug = require('debug')('scheduler:bull:delete-user-data');

module.exports = function(bullSystem) {
  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async resolve => {
      const { invoiceId, userId } = job.data;

      const invoice = Invoice.find({
        _id: invoiceId,
        userId: userId,
        totalAmount: {
          $gt: 0,
        },
        paymentStatus: {
          $in: [Invoice.PaymentStatusMapping.Pending, Invoice.PaymentStatusMapping.Failed],
        },
        preventDelete: {
          $ne: true,
        },
      }).fetch()[0];

      if (!invoice) {
        ElasticLogger.log('Invoice paid before deleting user data', { invoiceId, userId });
        return resolve();
      }

      await User.deleteAllUserData({ userId });

      return resolve();
    });
  });

  bullSystem.bullJobs.process('delete-user-data', processFunction);
};
