import SupportTicket from '../index';
import { Networks } from '../../networks/networks';

const MIN_ADMIN_LEVEL = 0;
const pageSize = 10;
Meteor.publish('support.user', function() {
  return SupportTicket.find({
    createdBy: Meteor.userId(),
  });
});

Meteor.publish('support.id', function(id) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }

  const support = SupportTicket.find({
    _id: id,
  }).fetch()[0];

  if (!support) {
    return [];
  }

  const result = [];
  if (support.supportObject && support.supportObject.serviceType === 'network') {
    result.push(
      Networks.find(
        {
          _id: support.supportObject.serviceTypeId,
          user: support.createdBy,
        },
        {
          fields: {
            name: 1,
            _id: 1,
            instanceId: 1,
          },
        }
      )
    );
  }

  return [
    SupportTicket.find({
      _id: id,
    }),
    Meteor.users.find(
      { _id: support.createdBy },
      {
        fields: {
          profile: 1,
          emails: 1,
          _id: 1,
        },
      }
    ),
    ...result,
  ];
});

Meteor.publish('support.caseId', function(id) {
  const support = SupportTicket.find({
    createdBy: Meteor.userId(),
    caseId: id,
  }).fetch()[0];

  if (!support) {
    return [];
  }

  const result = [];
  if (support.supportObject && support.supportObject.serviceType === 'network') {
    result.push(
      Networks.find(
        {
          _id: support.supportObject.serviceTypeId,
          user: support.createdBy,
        },
        {
          fields: {
            name: 1,
            _id: 1,
            instanceId: 1,
          },
        }
      )
    );
  }
  return [
    SupportTicket.find({
      createdBy: Meteor.userId(),
      caseId: id,
    }),
    Meteor.users.find(
      { _id: support.createdBy },
      {
        fields: {
          profile: 1,
          emails: 1,
          _id: 1,
        },
      }
    ),
    ...result,
  ];
});

Meteor.publish('support.all', function({ page }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  return SupportTicket.find(
    {},
    {
      limit: pageSize,
      skip: page * pageSize,
      sort: {
        createdAt: 1,
      },
    }
  );
});

Meteor.publish('support.search', function({ query, limit, page }) {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  limit = limit || pageSize;
  page = page || 1;
  return SupportTicket.find(query, {
    sort: {
      createdAt: 1,
    },
    limit: limit,
    skip: (page - 1) * pageSize,
  });
});
