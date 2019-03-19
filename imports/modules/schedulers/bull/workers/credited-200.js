import { getEJSTemplate } from '../../../helpers/server';
import { sendEmail } from '../../../../api/emails/email-sender';
import Voucher from '../../../../collections/vouchers/voucher';
import CreditRedemption from '../../../../collections/vouchers/credits-redemption';
const debug = require('debug')('scheduler:bull:credited-200-email');

module.exports = function(bullSystem) {
  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async resolve => {
      const user = Meteor.users.find({ _id: job.data.userId }).fetch()[0];

      if (!user) {
        return resolve();
      }

      const voucher = Voucher.find({ code: 'BLOCKCLUSTER' }).fetch()[0];
      const previousRedemption = CreditRedemption.find({ userId: user._id, codeId: voucher._id }).fetch()[0];

      if (!previousRedemption) {
        ElasticLogger.log('$200 not redeemed', {
          voucherId: voucher._id,
          userId: user._id,
        });
        return resolve();
      }

      const ejsTemplate = await getEJSTemplate({ fileName: 'credited-200' });
      const finalHTML = ejsTemplate({
        user: {
          name: `${user.profile.firstName} ${user.profile.lastName}`,
        },
      });

      const emailProps = {
        from: { email: 'no-reply@blockcluster.io', name: 'Blockcluster' },
        to: user.emails[0].address,
        subject: `$200 Credited to Blockcluster`,
        text: `$200 credited to your blockcluster account`,
        html: finalHTML,
      };

      await sendEmail(emailProps);

      return true;
    });
  });

  bullSystem.bullJobs.process('credited-200-email', processFunction);
};
