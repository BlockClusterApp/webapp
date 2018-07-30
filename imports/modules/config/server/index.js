const defaults = require("../local.config.js");
const fs = require("fs");
const path = require("path");

const RemoteConfig = require('../kube-config.json');
// let locationMapping = {};

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
    prefix = `-${locationCode}`;
  }
  switch (process.env.NODE_ENV) {
    case "production":
      return `app${prefix}.blockcluster.io`;
    case "staging":
      return `app${prefix}.blockcluster.io`;
    case "test":
      return `test${prefix}.blockcluster.io`;
    default:
      return `dev${prefix}.blockcluster.io`;

  }
}

function getNamespace() {
  return process.env.NAMESPACE || defaults.namespace || "dev";
};

function getEnv() {
  if(['production', 'staging', 'test', 'dev'].includes(process.env.NODE_ENV)){
    return process.env.NODE_ENV;
  }
  return "dev";
}

// const locationConfigs = RemoteConfig.clusters[getEnv()];
// locationConfigs.forEach(lc => {
//   locationMapping[lc.locationCode] = lc.locationName;
// });

module.exports = {
  sendgridAPIKey: process.env.SENDGRID_API_KEY || defaults.sendgridApi,
  workerNodeIP: (locationCode = "us-west-2") => {
    const locationConfig = RemoteConfig.clusters[getEnv()][locationCode];
    return locationConfig.workerNodeIP;
  },
  redisHost: process.env.REDIS_HOST || defaults.redisHost,
  redisPort: process.env.REDIS_PORT || defaults.redisPort,
  apiHost: getAPIHost(),
  workerNodeDomainName: (locationCode = "us-west-2") => {
    return getDynamoWokerDomainName(locationCode);
  },
  kubeRestApiHost: (locationCode = "us-west-2") => {
    const locationConfig = RemoteConfig.clusters[getEnv()][locationCode];
    return locationConfig.masterApiHost;
  },
  clusterApiAuth: (locationCode = "us-west-2") => {
    const locationConfig = RemoteCOnfig.clusters[getEnv()][locationCode];
    return locationConfig.auth;
  },
  firewallPort: process.env.FIREWALL_PORT || defaults.firewallPort,
  namespace: getNamespace(),
  RemoteConfig() {
    return RemoteConfig
  },
  env: getEnv(),
  RazorPay: {
    id: process.env.RAZORPAY_ID || defaults.razorpay.id,
    secret: process.env.RAZORPAY_KEY || defaults.razorpay.secret
  }
  // locationMapping
};
