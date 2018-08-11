module.exports = (bullSystem) => {
  require('./repull-image')(bullSystem);
  require('./start-repull-image')(bullSystem);
}
