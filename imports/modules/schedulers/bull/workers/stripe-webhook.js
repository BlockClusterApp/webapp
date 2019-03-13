module.exports = function(bullSystem) {
  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(resolve => {
      const { data } = job;
      ElasticLogger.log('Processing Stripe webhook', { data });
      resolve();
    });
  });
  bullSystem.bullJobs.process('stripe-webhook', 5, processFunction);
};
