module.exports = bullSystem => {
  require('./repull-image')(bullSystem);
  require('./start-repull-image')(bullSystem);
  require('./razorpay-webhook')(bullSystem);
  require('./generate-bill-user')(bullSystem);
  require('./invoice-created-email')(bullSystem);
  require('./invoice-reminder-email')(bullSystem);
  require('./email-sender')(bullSystem);
  require('./send-webhook')(bullSystem);
  require('./delete-network')(bullSystem);
  require('./attach-razorpay-addons')(bullSystem);
  require('./clean-dangling-pods')(bullSystem);
};
