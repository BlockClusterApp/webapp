import Config from "../../config/server";

let locationConfigs = undefined;
let kubeURLs;

if(RemoteConfig.clusters) {
  locationConfigs = Object.values(RemoteConfig.clusters[Config.namespace]);
  kubeURLs = locationConfigs.map(lc => lc.masterAPIHost);
}

process.on('RemoteConfigChanged', () => {
  if(RemoteConfig.clusters) {
    locationConfigs = Object.values(RemoteConfig.clusters[Config.namespace]);
    kubeURLs = locationConfigs.map(lc => lc.masterAPIHost);
  }
})

function getLocationConfigURL(url) {
  if(!kubeURLs){
    kubeURLs = locationConfigs.map(lc => lc.masterAPIHost);
  }
  for (let locationConfig of locationConfigs) {
    if (url.indexOf(locationConfig.masterAPIHost) === 0) {
      return locationConfig;
    }
  }
  return RemoteConfig.clusters[Config.namespace]["us-west-2"];
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
  let isKubeURL = false;
  for (const url of kubeURLs) {
    if (requestOptions.url.includes(url)) {
      isKubeURL = true;
      break;
    }
  }

  if (!isKubeURL) {
    return undefined;
  }

  if (requestOptions.hasOwnProperty("auth")) {
    return undefined;
  }
  const locationConfig = getLocationConfigURL(requestOptions.url);
  requestOptions.auth = locationConfig.auth;
  return undefined;
});
