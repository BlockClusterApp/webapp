import PrivateHive from '../';

Meteor.publish('privatehive', () => {
  return PrivateHive.find({ active: true, deletedAt: null, userId: Meteor.userId() });
});

Meteor.publish('privatehive.one', query => {
  return PrivateHive.find({ active: true, deletedAt: null, userId: Meteor.userId(), ...query });
});
