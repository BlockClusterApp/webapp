import bull from '../../bull';
const debug = require('debug')('scheduler:agenda:generateMonthlyBill');
let uuid = '';

if (process.env.GENERATE_BILL) {
  uuid = require('uuid/v4')();
}

module.exports = function(agenda) {
  agenda.define(
    `generate-monthly-bill${uuid}`,
    { priority: 'highest' },
    Meteor.bindEnvironment(job => {
      console.log('generating bill');
      const query = {
        'emails.verified': true,
      };
      if (process.env.GENERATE_BILL) {
        query['emails.address'] = process.env.EMAIL || 'jibin.mathews@blockcluster.io';
      }
      const users = Meteor.users.find(query).fetch();
      debug('Generating bills for', users);
      ElasticLogger.log('Starting bill generation', { users: users.map(u => u.emails[0].address) });
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

  if (['staging', 'production'].includes(process.env.NODE_ENV)) {
    agenda.every('0 6 1 * *', `generate-monthly-bill`);
  } else if (process.env.GENERATE_BILL) {
    console.log('Bill will be generated in 20 seconds');
    agenda.schedule('in 20 seconds', `generate-monthly-bill${uuid}`);
  } else {
    agenda.every('0 6 1 * *', 'generate-monthly-bill');
  }
};
