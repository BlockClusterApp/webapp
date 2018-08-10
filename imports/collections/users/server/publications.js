
Meteor.publish(null, function() {
  return Meteor.users.find(this.userId, {fields: {emails: 1, profile: 1, admin: 1, _id: 1}})
});
const MIN_ADMIN_LEVEL = 0;
const pageSize = 10;
Meteor.publish("users.all", function({page}) {
  if(Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return Meteor.users.find({}, {
    limit: pageSize,
    skip: page * pageSize,
    sort: {
      createdAt: -1
    },
    fields: {
      emails: 1,
      profile: 1,
      admin: 1,
      _id: 1,
      createdAt: 1
    }
  });
});

Meteor.publish("users.search", function({query, limit, page}) {
  if(Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  limit = limit || pageSize;
  page = page || 0;
  return Meteor.users.find(query, {
    sort: {
      createdAt: -1
    },
    limit: limit,
    skip: page * pageSize
  });
});
