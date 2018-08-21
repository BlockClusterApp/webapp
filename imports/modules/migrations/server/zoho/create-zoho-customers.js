import Zoho from '../../../../api/payments/zoho';
import Bluebird from 'bluebird';

Migrations.add({
  version: 8,
  up: async function() {
    const users = Meteor.users.find({
      zohoCustomerId: null
    }).fetch();
    console.log('Creating Zoho accounts for', users.map(i => i.emails[0].address));
    await Bluebird.map(
      users,
      async user => {
        console.log('Creating for user ', user.emails[0].address);
        await Zoho.createCustomerFromUser(user._id);
        return true;
      },
      {
        concurrency: 10,
      }
    );
  },
  down: function() {
    Meteor.users.update(
      {},
      {
        $unset: {
          zohoCustomerId: '',
          currencyCode: '',
        },
      },
      {
        multi: true,
      }
    );
  },
});
