import SupportTicket from '../index';

const MIN_ADMIN_LEVEL = 0;
Meteor.publish("support.user", function() {
  return SupportTicket.find({
    createdBy: Meteor.userId()
  });
});

Meteor.publish("support.all", function({page}) {
  if(Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return SupportTicket.find({}, {
    limit: pageSize,
    skip: page * pageSize,
    sort: {
      createdAt: 1
    }
  });
});


Meteor.publish("support.search", function({query, limit, page}) {
  if(Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  limit = limit || pageSize;
  page = page || 0;
  return SupportTicket.find(query, {
    sort: {
      createdAt: 1
    },
    limit: limit,
    skip: page * pageSize
  });
});
