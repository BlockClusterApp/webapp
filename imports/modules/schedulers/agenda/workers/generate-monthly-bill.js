import bull from '../../bull';

module.exports = function(agenda) {

  agenda.define('generate-monthly-bill', {priority: 'highest'}, (job, done) => {
    const users = Meteor.users.find({"emails.verified": true});
    users.forEach(user => {
      bull.addJob('generate-bill-user', {
        userId: user._id
      }, {
        attempts: 5
      });
    });
    process.nextTick( () => {
      done();
    });
  });

  agenda.every('0 6 1 * *', 'generate-monthly-bill');
}
