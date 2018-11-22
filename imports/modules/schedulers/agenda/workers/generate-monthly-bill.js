import bull from '../../bull';
const debug = require('debug')('scheduler:agenda:generateMonthlyBill');

let uuid = '';
if (process.env.GENERATE_BILL) {
  uuid = require('uuid/v4')();
}

module.exports = function(agenda) {
  const name = `generate-monthly-bill-${uuid.split("-")[0]}`;

  console.log("Task name", name);

  agenda.define(
    name,
    { priority: 'highest' },
    Meteor.bindEnvironment(job => {
      debug("Starting bill generation");
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

  (async () => {
    if (['staging', 'production'].includes(process.env.NODE_ENV)) {
      await agenda.every('30 0 1 * *', name);
    } else if (process.env.GENERATE_BILL) {
      console.log('Bill will be generated in 20 seconds', name);
      await agenda.schedule('in 20 seconds', name);
    } else {
      await agenda.every('30 0 1 * *', name);
    }
  })();
};
