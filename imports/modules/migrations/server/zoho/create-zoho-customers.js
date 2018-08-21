import { ZohoSubscription } from '../../../../api/payments/zoho';
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
        try {
          const response = await ZohoSubscription.createCustomer({
            firstName: user.profile.firstName,
            currencyCode: 'USD',
            email: user.emails[0].address,
            id: user._id,
            lastName: user.profile.lastName,
          });
          if (response.customer) {
            Meteor.users.update(
              { _id: user._id },
              {
                $set: {
                  zohoCustomerId: response.customer.customer_id,
                  currencyCode: response.customer.currency_code,
                },
              }
            );
          }
        } catch (err) {
          console.log('Zoho migration err', err);
        }
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
