const defaults = require("../local.config.js");
const fs = require("fs");
const path = require("path");
var url = require('url');

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

function getHyperionConnectionDetails(locationCode) {
  if (process.env.HYPERION_URL) {
    return process.env.HYPERION_URL;
  }
  switch (process.env.NODE_ENV) {
    case "production":
      return [RemoteConfig.clusters['production'][locationCode].hyperion.ip, RemoteConfig.clusters['production'][locationCode].hyperion.port];
    case "staging":
      return [RemoteConfig.clusters['staging'][locationCode].hyperion.ip, RemoteConfig.clusters['staging'][locationCode].hyperion.port];
    case "test":
      return [RemoteConfig.clusters['test'][locationCode].hyperion.ip, RemoteConfig.clusters['test'][locationCode].hyperion.port];
    case "dev":
      return [RemoteConfig.clusters['dev'][locationCode].hyperion.ip, RemoteConfig.clusters['dev'][locationCode].hyperion.port];
    default:
      return [RemoteConfig.clusters['dev'][locationCode].hyperion.ip, RemoteConfig.clusters['dev'][locationCode].hyperion.port];
  }
}


function getDynamoWokerDomainName(locationCode) {
  let prefix = '';
  if(locationCode !== "us-west-2"){
    prefix = `-${locationCode}`;
  }
  switch (process.env.NODE_ENV) {
    case "production":
      const URL = process.env.ROOT_URL;
      return `${URL.split("://")[1].replace(".blockcluster.io", '')}${prefix}.blockcluster.io`;
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

function getDatabase() {
    const a  = process.env.MONGO_URL;
    if(!a){
        return "admin";
    }

    if(a.indexOf("?replica") === -1 ){
        return "admin"
    }

    const db = a.substring(a.lastIndexOf("/")+1, a.lastIndexOf("?replica"));
    if(!db){
        return "admin";
    }
    return db;
}

function getMongoConnectionString() {

    return process.env.MONGO_URL;

    if(['production'].includes(process.env.NODE_ENV)){
      return process.env.MONGO_URL;
    }

    const database = getDatabase();
    if(!process.env.MONGO_URL.includes(database)){
      return `${process.env.MONGO_URL}/${database}`;
    }

    return `mongodb://${q.host}/admin`;
}

// const locationConfigs = RemoteConfig.clusters[getEnv()];
// locationConfigs.forEach(lc => {
//   locationMapping[lc.locationCode] = lc.locationName;
// });

module.exports = {
  sendgridAPIKey: process.env.SENDGRID_API_KEY || defaults.sendgridApi,
  workerNodeIP: (locationCode = "us-west-2") => {
    const locationConfig = RemoteConfig.clusters[getEnv()][locationCode];
    if(!locationConfig){
      return RemoteConfig.clusters[getEnv()]["ap-south-1b"].workerNodeIP;
    }
    return locationConfig.workerNodeIP;
  },
  redisHost: process.env.REDIS_HOST || defaults.redisHost,
  redisPort: process.env.REDIS_PORT || defaults.redisPort,
  apiHost: getAPIHost(),
  database: getDatabase(),
  mongoConnectionString: getMongoConnectionString(),
  getHyperionConnectionDetails: getHyperionConnectionDetails,
  workerNodeDomainName: (locationCode = "us-west-2") => {
    return getDynamoWokerDomainName(locationCode);
  },
  kubeRestApiHost: (locationCode = "us-west-2") => {
    const locationConfig = RemoteConfig.clusters[getEnv()][locationCode];
    if(!locationConfig){
      return RemoteConfig.clusters[getEnv()]["ap-south-1b"].masterApiHost;
    }
    return locationConfig.masterApiHost;
  },
  clusterApiAuth: (locationCode = "us-west-2") => {
    const locationConfig = RemoteConfig.clusters[getEnv()][locationCode];
    if(!locationConfig){
      return RemoteConfig.clusters[getEnv()]["ap-south-1b"].auth;
    }
    return locationConfig.auth;
  },
  namespace: getNamespace(),
  RemoteConfig() {
    return RemoteConfig
  },
  env: getEnv(),
  RazorPay: {
    id: process.env.RAZORPAY_ID || defaults.razorpay.id,
    secret: process.env.RAZORPAY_KEY || defaults.razorpay.secret
  },
  NetworkUpdate: {
    id: process.env.NETWORK_UPDATE_ID,
    key: process.env.NETWORK_UPDATE_KEY
  },
  Zoho: {
    organizationId: process.env.ZOHO_ORGANIZATION_ID || defaults.zoho.organizationId,
    authToken: process.env.ZOHO_AUTH_TOKEN || defaults.zoho.authToken
  },
  Raven: {
    dsn: ( () => {
      if(process.env.NODE_ENV === 'production') {
        return 'https://30e285a684c74bb5a726673ca0cf6707:198e6d34e7094612a771ee388fdad1dd@sentry.io/1274301'
      } else if (process.env.NODE_ENV === 'staging') {
        return 'https://e6be112ac8e343d2b0409d561d578e4e@sentry.io/1275118'
      } else if (process.env.ENABLE_SENTRY) {
        return 'https://4d3e7232bb49468da0eb16c4cb370b5f@sentry.io/1275120'
      }
    })()
  }
  // locationMapping
};
