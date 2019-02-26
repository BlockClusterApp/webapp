import PrivateHive from '../';

const MIN_ADMIN_LEVEL = 1;
const pageSize = 10;

Meteor.publish('privatehive', () => {
  return PrivateHive.find({ active: true, deletedAt: null, userId: Meteor.userId() });
});

Meteor.publish('privatehive.one', query => {
  query = query || {};
  return PrivateHive.find({ active: true, deletedAt: null, userId: Meteor.userId(), ...query });
});

Meteor.publish('privatehive.all', function({ page }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return PrivateHive.find(
    {},
    {
      limit: pageSize,
      skip: page * pageSize,
      sort: {
        createdAt: -1,
      },
      fields: {
        instanceId: 1,
        locationCode: 1,
        status: 1,
        createdAt: 1,
        deletedAt: 1,
        active: 1,
        networkConfig: 1,
        _id: 1,
        name: 1,
      },
    }
  );
});

Meteor.publish('privatehive.search', function({ query, limit, page }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  limit = limit || pageSize;
  page = page || 1;
  return PrivateHive.find(query, {
    fields: {
      instanceId: 1,
      createdAt: 1,
      locationCode: 1,
      status: 1,
      active: 1,
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
