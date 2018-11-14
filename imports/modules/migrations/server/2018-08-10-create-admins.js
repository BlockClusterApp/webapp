const emails = ['admin@blockcluster.io'];

Migrations.add({
  version: 6,
  up: function() {
    emails.forEach(email => {
      console.log('Creating admin ', email);
      const adminUserId = Accounts.createUser({
        password: 'admin@blockcluster',
        email,
        profile: {
          name: 'Blockcluster Admin',
          createdOn: new Date(),
        },
      });
      Meteor.users.update(
        { _id: adminUserId },
        {
          $set: {
            createdAt: new Date(),
            emails: [
              {
                address: email,
                verified: true,
              },
            ],
            profile: {
              firstName: 'Admin',
              lastName: 'Blockcluster',
            },
            admin: 2,
          },
        }
      );
    });
    console.log('Finished creating admins');
  },
  down: function() {
    emails.forEach(email => {
      Meteor.users.remove({
        'emails.address': email,
      });
    });
  },
});
