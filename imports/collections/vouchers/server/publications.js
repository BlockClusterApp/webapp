import Voucher from '../voucher';
import Campaign from '../campaign';

const pageSize = 20;
const MIN_ADMIN_LEVEL = 0;

Meteor.publish('campaign.all', function() {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return Campaign.find();
});

Meteor.publish('vouchers.all', function({ page, type }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }

  const query = {};
  if (type === 'campaign') {
    return Campaign.find(
      {},
      {
        limit: pageSize,
        skip: page * pageSize,
        sort: {
          createdAt: -1,
        },
      }
    );
  }

  if (type === 'network') {
    query.type = {
      $in: [null, 'network'],
    };
  } else {
    query.type = type;
  }

  return Voucher.find(query, {
    limit: pageSize,
    skip: page * pageSize,
    sort: {
      createdAt: -1,
    },
  });
});

Meteor.publish('vouchers.search', function({ query, limit, page, type }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }

  query.type = type;

  limit = limit || pageSize;
  page = page || 1;

  if (query.type === 'campaign') {
    delete query.type;
    return Campaign.find(query, {
      sort: {
        createdAt: -1,
      },
      limit: limit,
      skip: (page - 1) * pageSize,
    });
  }

  if (query.type === 'network') {
    query.type = {
      $in: [null, 'network'],
    };
  }

  return Voucher.find(query, {
    sort: {
      createdAt: -1,
    },
    limit: limit,
    skip: (page - 1) * pageSize,
  });
});
