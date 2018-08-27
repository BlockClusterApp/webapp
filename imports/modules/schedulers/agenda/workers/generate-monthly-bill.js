import bull from '../../bull';
const debug = require('debug')('scheduler:agenda:generateMonthlyBill');

module.exports = function(agenda) {
  console.log('Starting generate bill agenda');
  agenda.define(
    'generate-monthly-bill',
    { priority: 'highest' },
    Meteor.bindEnvironment((job) => {
      const users = Meteor.users.find({ 'emails.verified': true }).fetch();
      debug('Generating bills for', users);
      users.forEach(user => {
        bull.addJob(
          'generate-bill-user',
          {
            userId: user._id,
          },
          {
            attempts: 5,
          }
        );
      });
    })
  );

  if (process.env.NODE_ENV === 'production') {
    agenda.every('0 6 1 * *', 'generate-monthly-bill');
  } else if (process.env.GENERATE_BILL) {
    console.log('Bill will be generated in 20 seconds');
    agenda.schedule('in 20 seconds', 'generate-monthly-bill');
  } else {
    agenda.every('0 6 1 * *', 'generate-monthly-bill');
  }
};
