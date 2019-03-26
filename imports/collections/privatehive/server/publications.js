import PrivateHive from '../';
import { PrivatehivePeers } from '../../privatehivePeers/privatehivePeers';
import { PrivatehiveOrderers } from '../../privatehiveOrderers/privatehiveOrderers';

const MIN_ADMIN_LEVEL = 1;
const pageSize = 10;

Meteor.publish('privatehive', () => {
  const query = { active: true, deletedAt: null, userId: Meteor.userId() };
  return [PrivatehivePeers.find(query), PrivatehiveOrderers.find(query)];
});

Meteor.publish('privatehive.one', query => {
  query = query || {};
  const finalQuery = { active: true, deletedAt: null, userId: Meteor.userId(), ...query };
  // const networks = PrivateHive.find({ active: true, deletedAt: null, userId: Meteor.userId(), ...query }).fetch();
  // const orderers = networks.reduce((co, network) => {
  //   if (!co.includes(network.ordererId) && network.ordererId) {
  //     co.push(network.ordererId);
  //   }
  //   return co;
  // }, []);
  return [PrivatehivePeers.find(finalQuery), PrivatehiveOrderers.find(finalQuery)];
});

Meteor.publish('privatehive.all', function({ page }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  const options = {
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
  };
  return [PrivatehivePeers.find({}, options), PrivatehiveOrderers.find({}, options)];
});

Meteor.publish('privatehive.search', function({ query, limit, page }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  limit = limit || pageSize;
  page = page || 1;

  const options = {
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
  };
  return [PrivatehivePeers.find(query, options), PrivatehiveOrderers.find(query, options)];
});
