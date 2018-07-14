import Config from "../../config/server";
const RemoteConfig = require('../../config/kube-config.json');

const namespace = Config.namespace;
const locationConfigs = Object.keys(RemoteConfig.clusters[namespace]);

function getLocationConfigURL(url) {
  for(let locationConfig of locationConfigs) {
    if(url.indexOf(locationConfig.masterApiHost) === 0){
      return locationConfig;
    }
  }
  return RemoteConfig.clusters[namespace]["us-west-2"];
}

HTTP.setInterceptorFunction(requestOptions => {
  /*
    Sample requestOptions 
    {
      url: "https://www.google.com",
      method: "GET",
      body: "Some content",
      headers: headers
    }
  */
  if(requestOptions.hasOwnProperty("auth")){
    return undefined;
  }
  const locationConfig = getLocationConfigURL(requestOptions.url);
  requestOptions.auth = locationConfig.auth;
  return undefined;
});

console.log("Attaching HTTP interceptors");
