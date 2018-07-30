const defaults = require("../local.config.js");
function getAPIHost() {
  if (process.env.ROOT_URL) {
    return process.env.ROOT_URL;
  }
  switch (process.env.NODE_ENV) {
    case "production":
      return "https://app.blockcluster.io";
    case "staging":
      return "https://staging.blockcluster.io";
    case "test":
      return "https://test.blockcluster.io";
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
  workerNodeIP: process.env.WORKER_NODE_IP || defaults.workerNodeIP,
  apiHost: getAPIHost(),
  workerNodeDomainName: (locationCode = "us-west-2") => {
    return getDynamoWokerDomainName(locationCode)
  },
  kubeRestApiHost: process.env.KUBE_REST_API_HOST || defaults.kubeRestApiHost,
  namespace: process.env.NAMESPACE || defaults.namespace,
  firewallPort: process.env.FIREWALL_PORT || defaults.firewallPort
};
