const defaults = require("../local.config.js");
const fs = require("fs");
const path = require("path");

const RemoteConfig = require('../kube-config.json')

function getAPIHost() {
  if (process.env.API_HOST) {
    return process.env.API_HOST;
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

function getNamespace() {
  return process.env.NAMESPACE || defaults.namespace || "dev";
};

module.exports = {
  sendgridAPIKey: process.env.SENDGRID_API_KEY || defaults.sendgridApi,
  workerNodeIP: (locationCode = "us-west-2") => {
    const locationConfig = RemoteConfig.clusters[getNamespace()][locationCode];
    return locationConfig.workerNodeIP;
  },
  redisHost: process.env.REDIS_HOST || defaults.redisHost,
  redisPort: process.env.REDIS_PORT || defaults.redisPort,
  apiHost: getAPIHost(),
  workderNodeDomainName: (() => {
    return getAPIHost().split("://")[1];
  })(),
  kubeRestApiHost: (locationCode = "us-west-2") => {
    const locationConfig = RemoteConfig.clusters[getNamespace()][locationCode];
    return locationConfig.masterApiHost;
  },
  clusterApiAuth: (locationCode = "us-west-2") => {
    const locationConfig = RemoteCOnfig.clusters[getNamespace()][locationCode];
    return locationConfig.auth;
  },
  firewallPort: process.env.FIREWALL_PORT || defaults.firewallPort,
  namespace: getNamespace(),
  RemoteConfig() {
    return RemoteConfig
  }
};
