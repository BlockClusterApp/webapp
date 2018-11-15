import ApiKeys from '../';
import { Meteor } from 'meteor/meteor';

Meteor.publish('apiKeys.all', function() {
  return ApiKeys.find({ userId: Meteor.userId(), active: true });
});
