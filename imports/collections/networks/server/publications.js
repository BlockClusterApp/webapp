import {Networks} from "../networks.js"

Meteor.publish("networks", function () {
	return Networks.find({user: this.userId, active: true});
});

const pageSize = 20;
Meteor.publish("networks.all", function({page}) {
  return Networks.find({}, {
    limit: pageSize,
    skip: page * pageSize,
    sort: {
      createdAt: -1
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
      name: 1
    }
  });
});


Meteor.publish("networks.search", function({query, limit, page}) {
  limit = limit || pageSize;
  page = page || 0;
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
      name: 1
    },
    sort: {
      createdAt: -1
    },
    limit: limit,
    skip: page * pageSize
  });
});
