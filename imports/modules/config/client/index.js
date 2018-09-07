const defaults = require("../local.config.js");
function getAPIHost() {
  console.log("ROOT_URL", process.env.ROOT_URL);
  if (process.env.ROOT_URL) {
    if(process.env.ROOT_URL === 'https://test.blockcluster.io') {
      return "https://dev.blockcluster.io";
    }
    return process.env.ROOT_URL;
  }
  switch (process.env.NODE_ENV) {
    case "production":
      return "https://app.blockcluster.io";
    case "staging":
      return "https://staging.blockcluster.io";
    case "test":
      return "https://dev.blockcluster.io";
    case "dev":
      return "https://dev.blockcluster.io";
    default:
      return `http://localhost:${process.env.PORT || "3000"}`;
  }
}

function getDynamoWokerDomainName(locationCode) {
  let prefix = '';
    if(locationCode !== "us-west-2"){
      prefix = `-${locationCode}`
    }
  const host = window.location.origin.includes("localhost") ? 'https://dev.blockcluster.io' : window.location.origin;
  const url = `${host.split("://")[1].replace(".blockcluster.io", '')}${prefix}.blockcluster.io`;
  return url;
}

module.exports = {
  apiHost: getAPIHost(),
  workerNodeDomainName: (locationCode = "us-west-2") => {
    return getDynamoWokerDomainName(locationCode)
  },
  namespace: process.env.NAMESPACE || defaults.namespace,
  Raven: {
    dsn: ( () => {
      if(process.env.NODE_ENV === 'production' || (window && window.location && window.location.origin.includes('https://app.blockcluster.io'))) {
        return 'https://778581990f3e46daaac3995e1e756de5@sentry.io/1274848'
      } else if (process.env.NODE_ENV === 'staging' || (window && window.location && window.location.origin.includes('https://staging.blockcluster.io'))) {
        return 'https://05bdf7f60e944515b1f4a59a79116063@sentry.io/1275121'
      } else if (window && window.location && window.location.origin.includes('https://dev.blockcluster.io')) {
        return 'https://52847e2f5c05463e91789eb2c1b75bcb@sentry.io/1275122'
      }
    })()
  }
};
