import Config from "../../config/server";
const RemoteConfig = Config.RemoteConfig();

const namespace = Config.namespace;
const locationConfigs = Object.values(RemoteConfig.clusters[namespace]);

function getLocationConfigURL(url) {
  for (let locationConfig of locationConfigs) {
    if (url.indexOf(locationConfig.masterApiHost) === 0) {
      return locationConfig;
    }
  }
  return RemoteConfig.clusters[namespace]["us-west-2"];
}

const kubeURLs = locationConfigs.map(lc => lc.masterApiHost);

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
    if (url.includes(requestOptions.url)) {
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

console.log("Attaching HTTP interceptors");
