import bull from '../../schedulers/bull';
Migrations.add({
  version: 10,
  up: async function() {
    const query = {
      'emails.verified': true,
    };
    const users = Meteor.users.find(query).fetch();
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
    return true;
  },
  down: function() {
    console.log('No down');
  },
});
