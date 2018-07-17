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

function getDynamoWokerDomainName() {
  switch (process.env.NODE_ENV) {
    case "production":
      return "app.blockcluster.io";
    case "staging":
      return "app.blockcluster.io";
    case "test":
      return "test.blockcluster.io";
    default:
      return "dev.blockcluster.io";
  }
}

module.exports = {
  workerNodeIP: process.env.WORKER_NODE_IP || defaults.workerNodeIP,
  apiHost: getAPIHost(),
  workerNodeDomainName: (() => {
    return getDynamoWokerDomainName();
  })(),
  kubeRestApiHost: process.env.KUBE_REST_API_HOST || defaults.kubeRestApiHost,
  namespace: process.env.NAMESPACE || defaults.namespace,
  firewallPort: process.env.FIREWALL_PORT || defaults.firewallPort
};
