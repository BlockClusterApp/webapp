module.exports = (agenda) => {
  console.log("Loading agenda workers");
  require('./generate-monthly-bill')(agenda);
  require('./forex-update')(agenda);
  require('./invoice-reminder-email')(agenda);
  require('./attach-razorpay-addons')(agenda);
  require('./paymeter-crons')(agenda);
}
