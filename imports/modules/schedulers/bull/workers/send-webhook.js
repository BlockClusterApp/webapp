import Webhook from '../../../../api/communication/webhook';
const debug = require('debug')('scheduler:bull:sendWebhook');

module.exports = function(bullSystem) {
  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async resolve => {
      const { data } = job;
      const { id } = data;

      debug("Sending webhook", id);

      await Webhook.send({ id });
      resolve();
    });
  });

  bullSystem.bullJobs.process('send-webhook', processFunction);
};
