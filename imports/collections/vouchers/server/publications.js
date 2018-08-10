import Voucher from '../voucher';

const pageSize = 20;
const MIN_ADMIN_LEVEL = 0;
Meteor.publish("vouchers.all", function({page}) {
  if(Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return Voucher.find({}, {
    limit: pageSize,
    skip: page * pageSize,
    sort: {
      createdAt: -1
    }
  });
});


Meteor.publish("vouchers.search", function({query, limit, page}) {
  if(Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  limit = limit || pageSize;
  page = page || 0;
  return Voucher.find(query, {
    sort: {
      createdAt: -1
    },
    limit: limit,
    skip: page * pageSize
  });
});
