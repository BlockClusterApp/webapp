import NetworkConfig from '../network-configuration';

Meteor.publish('networkConfig.all', () => {
  return NetworkConfig.find({ active: true, for: 'dynamo' });
});

Meteor.publish('networkConfig.privatehive', () => {
  return NetworkConfig.find({ active: true, for: 'privatehive' });
});
