
Meteor.publish(null, function() {
  return Meteor.users.find(this.userId, {fields: {emails: 1, profile: 1, admin: 1, _id: 1}})
});

const pageSize = 10;
Meteor.publish("users.all", function({page}) {
  return Meteor.users.find({}, {
    limit: 10,
    skip: page * pageSize,
    sort: {
      createdAt: -1
    }
  });
});
