import Config from "../../modules/config/server";
const RemoteConfig = Config.RemoteConfig();

const LocationConfigs = RemoteConfig.clusters[Config.env];

const LocationApi = {};

LocationApi.getLocations = function() {
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
