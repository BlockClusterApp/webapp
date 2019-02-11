import Webhook from '../';

Meteor.publish('platform-webhooks', function() {
  return Webhook.find(
    { userId: Meteor.userId() },
    {
      sort: {
        createdAt: -1,
      },
      limit: 10,
    }
  );
});
