import Voucher from '../voucher';

const pageSize = 20;
Meteor.publish("vouchers.all", function({page}) {
  return Voucher.find({}, {
    limit: pageSize,
    skip: page * pageSize,
    sort: {
      createdAt: -1
    }
  });
});


Meteor.publish("vouchers.search", function({query, limit, page}) {
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
