import Config from '../../modules/config/server';
import LocationConfiguration from '../../collections/locations';
let LocationConfigs;

const MIN_ADMIN_LEVEL = 2;

process.on('RemoteConfigChanged', () => {
  if (RemoteConfig.clusters) {
    LocationConfigs = RemoteConfig.clusters[Config.namespace];
  }
});

if (RemoteConfig.clusters) {
  LocationConfigs = RemoteConfig.clusters[Config.namespace];
}
const LocationApi = {};

LocationApi.updateServiceLocations = async ({ service, locationMapping }) => {
  if (Meteor.user().admin < MIN_ADMIN_LEVEL) {
    throw new Meteor.Error('401', 'Unauthorized');
  }
  let locationConfig = LocationConfiguration.find({ service }).fetch()[0];
  if (!locationConfig) {
    LocationConfiguration.insert({ service, locations: [] });
    locationConfig = LocationConfiguration.find({ service }).fetch()[0];
  }

  locationConfig.locations.forEach(loc => {
    if (locationMapping[loc] === undefined || locationMapping[loc] === null) {
      locationMapping[loc] = true;
    }
  });

  const newLocation = [];
  Object.keys(locationMapping).forEach(loc => {
    if (locationMapping[loc] === true) {
      newLocation.push(loc);
    }
  });
  LocationConfiguration.update(
    {
      service,
    },
    {
      $set: {
        locations: newLocation,
      },
    }
  );

  return true;
};

LocationApi.getLocations = async function({ service, userId }) {
  const availableLocs = Object.values(LocationConfigs).reduce((list, locationConfig) => {
    list.push({
      locationCode: locationConfig.locationCode,
      locationName: locationConfig.locationName,
      workerNodeIP: locationConfig.workerNodeIP,
    });
    return list;
  }, []);
  if (!service) {
    return availableLocs;
  }
  const serviceLocations = LocationConfiguration.find({ service }).fetch()[0];
  if (!serviceLocations) {
    return availableLocs;
  }

  if (!userId) {
    userId = Meteor.userId();
  }
  const user = Meteor.users.find({ _id: userId }).fetch()[0];
  user.disabledLocations = user.disabledLocations || [];

  const available = [];
  availableLocs.forEach(loc => {
    if (serviceLocations.locations.includes(loc.locationCode) && !user.disabledLocations.includes(loc.locationCode)) {
      available.push(loc);
    }
  });

  return available;
};

JsonRoutes.add('get', '/api/config-client', function(req, res, next) {
  const config = {};
  config.features = RemoteConfig.features;
  config.workerDomainName = {};
  Object.keys(RemoteConfig.clusters[Config.namespace]).forEach(locationCode => {
    config.workerDomainName[locationCode] = RemoteConfig.clusters[Config.namespace][locationCode].dynamoDomainName;
  });
  config.NAMESPACE = Config.namespace;
  JsonRoutes.sendResult(res, {
    data: config,
  });
});

Meteor.methods({
  getClusterLocations: LocationApi.getLocations,
  updateServiceLocations: LocationApi.updateServiceLocations,
});

export default LocationApi;
