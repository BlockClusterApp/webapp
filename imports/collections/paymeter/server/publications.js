import { Paymeter } from '../paymeter.js';

const MIN_ADMIN_LEVEL = 1;
const pageSize = 20;

Meteor.publish('paymeter_user_data', function() {
  return Paymeter.find({ userId: this.userId });
});

Meteor.publish('paymeter.all', function() {
  if (Meteor.user().admin < 1) {
    return [];
  }
  const users = [];
  return Paymeter.find({});
});

Meteor.publish('paymeter.search', ({ query, limit, page }) => {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  limit = limit || pageSize;
  page = page || 1;

  const users = Paymeter.find(query, { fields: { userId: 1, _id: 1 } }).fetch();
  const userIds = users.map(p => p.userId);
  return [Paymeter.find(query), Meteor.users.find({ _id: { $in: userIds } })];
});
