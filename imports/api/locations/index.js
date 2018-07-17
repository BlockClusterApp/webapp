import Config from "../../modules/config/server";
const RemoteConfig = Config.RemoteConfig();

const LocationConfigs = RemoteConfig.clusters[Config.namespace];

const LocationApi = {};

LocationApi.getLocations = function() {
  return Object.values(LocationConfigs).reduce((list, locationConfig) => {
    list.push({
      locationCode: locationConfig.locationCode,
      locationName: locationConfig.locationName
    });
    return list;
  }, []);
};

Meteor.methods({
  getClusterLocations: LocationApi.getLocations
});
