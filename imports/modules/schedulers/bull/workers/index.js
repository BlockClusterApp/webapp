module.exports = (bullSystem) => {
  require('./repull-image')(bullSystem);
  require('./start-repull-image')(bullSystem);
  require('./razorpay-webhook')(bullSystem);
  require('./generate-bill-user')(bullSystem);
  require('./invoice-created-email')(bullSystem);
  require('./invoice-reminder-email')(bullSystem);
}
