import NetworkConfig from '../network-configuration';

Meteor.publish('networkConfig.all', () => {
  return NetworkConfig.find({active: true});
});
