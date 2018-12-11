import Webhook from '../';

Meteor.publish('platform-webhooks', function() {
  return Webhook.find(
    { userId: Meteor.userId() },
    {
      limit: 10,
    }
  );
});
