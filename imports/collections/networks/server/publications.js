import { Networks } from '../networks.js';

Meteor.publish('networks', function() {
  return Networks.find({ user: this.userId, active: true });
});

const MIN_ADMIN_LEVEL = 0;
const pageSize = 20;
Meteor.publish('networks.all', function({ page }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return Networks.find(
    {},
    {
      limit: pageSize,
      skip: page * pageSize,
      sort: {
        createdAt: -1,
      },
      fields: {
        instanceId: 1,
        createdOn: 1,
        locationCode: 1,
        status: 1,
        createdAt: 1,
        deletedAt: 1,
        networkConfig: 1,
        _id: 1,
        name: 1,
        peerType: 1,
      },
    }
  );
});

Meteor.publish('networks.search', function({ query, limit, page }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  limit = limit || pageSize;
  page = page || 1;
  return Networks.find(query, {
    fields: {
      instanceId: 1,
      createdOn: 1,
      locationCode: 1,
      status: 1,
      createdAt: 1,
      networkConfig: 1,
      deletedAt: 1,
      _id: 1,
      name: 1,
    },
    sort: {
      createdAt: -1,
    },
    limit: limit,
    skip: (page - 1) * pageSize,
  });
});
