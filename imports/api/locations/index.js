import Config from "../../modules/config/server";
let LocationConfigs;

process.on('RemoteConfigChanged', () => {
  console.log("RemoteConfigChanged");
  if(RemoteConfig.clusters) {
    LocationConfigs = RemoteConfig.clusters[Config.namespace];
  }
});
if(RemoteConfig.clusters) {
  LocationConfigs = RemoteConfig.clusters[Config.namespace];
}
const LocationApi = {};

LocationApi.getLocations = function() {
  console.log("Get Locations", LocationConfigs);
  return Object.values(LocationConfigs).reduce((list, locationConfig) => {
    list.push({
      locationCode: locationConfig.locationCode,
      locationName: locationConfig.locationName,
      workerNodeIP: locationConfig.workerNodeIP
    });
    return list;
  }, []);
};

Meteor.methods({
  getClusterLocations: LocationApi.getLocations
});

export default LocationApi;
