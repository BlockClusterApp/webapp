module.exports = (agenda) => {
  console.log("Loading agenda workers");
  require('./generate-monthly-bill')(agenda);
  require('./forex-update')(agenda);
}
