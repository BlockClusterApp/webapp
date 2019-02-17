import LocationConfiguration from '../index';

Meteor.publish('locations-config', ({ service }) => LocationConfiguration.find({ service }));
