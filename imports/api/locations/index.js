import Config from '../../modules/config/server';
let LocationConfigs;

process.on('RemoteConfigChanged', () => {
  if (RemoteConfig.clusters) {
    LocationConfigs = RemoteConfig.clusters[Config.namespace];
  }
});
if (RemoteConfig.clusters) {
  LocationConfigs = RemoteConfig.clusters[Config.namespace];
}
const LocationApi = {};

LocationApi.getLocations = function() {
  return Object.values(LocationConfigs).reduce((list, locationConfig) => {
    list.push({
      locationCode: locationConfig.locationCode,
      locationName: locationConfig.locationName,
      workerNodeIP: locationConfig.workerNodeIP,
    });
    return list;
  }, []);
};

JsonRoutes.add('get', '/api/config-client', function(req, res, next) {
  const config = {};
  config.features = RemoteConfig.features;
  config.workerDomainName = {}
  Object.keys(RemoteConfig.clusters[Config.namespace]).forEach(locationCode => {
    config.workerDomainName[locationCode] = RemoteConfig.clusters[Config.namespace][locationCode].dynamoDomainName
  });
  config.NAMESPACE = Config.namespace;
  JsonRoutes.sendResult(res, {
    data: config
  });
});

Meteor.methods({
  getClusterLocations: LocationApi.getLocations,
});

export default LocationApi;
