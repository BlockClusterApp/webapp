const defaults = require('../local.config.js');
const request = require('request-promise');
const debug = require('debug')('RemoteConfig');

const WEB_APP_VERSION = '1.0';
const MIGRATION_VERSION = 11;

global.RemoteConfig = {};
global.LicenceError = 0;

global.isConfigFetched = false;

const CONFIG_URL = (function() {
  if (process.env.NODE_ENV === 'development') {
    if (process.env.CONFIG_URL) {
      return process.env.CONFIG_URL;
    }
    return `http://35.161.9.16:32344`;
  } else {
    return `http://blockcluster-agent.blockcluster.svc.cluster.local`;
  }
})();

async function fetchNewConfig() {
  // const migrationDBVersion = Migrations.getVersion();
  const response = await request.get(`${CONFIG_URL}/config?webAppVersion=${WEB_APP_VERSION}&migrationVersion=${MIGRATION_VERSION}`);
  const res = JSON.parse(response);
  if (res.errorCode && res.errorCode === 404) {
    global.LicenceError += 1;
    global.RemoteConfig = {
      Ingress: {},
    };
  } else {
    if (!global.isConfigFetched) {
      console.log('Fetching licence information');
    }
    global.isConfigFetched = true;
    global.RemoteConfig = res;
    global.LicenceError = 0;
  }

  if (!global.RemoteConfig.Ingress) {
    global.RemoteConfig.Ingress = {};
  }

  global.RemoteConfig.Ingress = global.RemoteConfig.Ingress[getNamespace()] || { Annotations: {} };

  if (global.LicenceError > 60) {
    // Can be down for 60 minutes
    global.RemoteConfig = {
      Ingress: {},
    };
  }

  debug('Remote config', JSON.stringify(RemoteConfig));

  process.emit('RemoteConfigChanged');
}

fetchNewConfig();

setInterval(
  async () => {
    await fetchNewConfig();
  },
  process.env.NODE_ENV === 'development' ? 10 * 1000 : 1 * 60 * 1000
);

export { MIGRATION_VERSION };

function getAPIHost() {
  if (RemoteConfig.apiHost) {
    return RemoteConfig.apiHost[getNamespace()];
  }
  if (process.env.ROOT_URL) {
    return process.env.ROOT_URL;
  }
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'https://app.blockcluster.io';
    case 'staging':
      return 'https://staging.blockcluster.io';
    case 'test':
      return 'https://test.blockcluster.io';
    case 'dev':
      return 'https://dev.blockcluster.io';
    default:
      return `http://localhost:${process.env.PORT || '3000'}`;
  }
}

function getHyperionConnectionDetails(locationCode) {
  if (process.env.HYPERION_URL) {
    return process.env.HYPERION_URL;
  }
  return [
    RemoteConfig.clusters[getNamespace()][locationCode].workerNodeIP,
    RemoteConfig.clusters[getNamespace()][locationCode].hyperion.ipfsPort,
    RemoteConfig.clusters[getNamespace()][locationCode].hyperion.ipfsClusterPort,
  ];
}

async function getPaymeterConnectionDetails(blockchain, network) {
  if (process.env.paymeter) {
    return process.env.paymeter;
  }
  return RemoteConfig.paymeter[getNamespace()].blockchains[blockchain][network].url;
}

async function getCoinmarketcapAPIKey() {
  if (process.env.coinmarketcap_key) {
    return process.env.coinmarketcap_key;
  }
  return RemoteConfig.paymeter[getNamespace()].api_keys.coinmarketcap;
}

async function getEthplorerAPIKey() {
  if (process.env.coinmarketcap_key) {
    return process.env.coinmarketcap_key;
  }
  return RemoteConfig.clusters[getNamespace()][locationCode].api_keys.ethplorer;
}

function getDynamoWokerDomainName(locationCode) {
  if (RemoteConfig.clusters) {
    const locationConfig = RemoteConfig.clusters[getNamespace()][locationCode];
    if (locationConfig) {
      return locationConfig.dynamoDomainName;
    }
    return RemoteConfig.apiHost[locationCode];
  }
  let prefix = '';
  if (locationCode !== 'us-west-2') {
    prefix = `-${locationCode}`;
  }
  switch (process.env.NODE_ENV) {
    case 'production':
      const URL = process.env.ROOT_URL;
      return `${URL.split('://')[1].replace('.blockcluster.io', '')}${prefix}.blockcluster.io`;
    case 'staging':
      return `app${prefix}.blockcluster.io`;
    case 'test':
      return `test${prefix}.blockcluster.io`;
    default:
      return `dev${prefix}.blockcluster.io`;
  }
}

function getNamespace() {
  // n
  return RemoteConfig.namespace || process.env.NAMESPACE || defaults.namespace || 'dev';
}

function getEnv() {
  if (['production', 'staging', 'test', 'dev'].includes(process.env.NODE_ENV)) {
    return process.env.NODE_ENV;
  }
  return 'dev';
}

function getDatabase() {
  const a = process.env.MONGO_URL;
  if (!a) {
    return 'admin';
  }

  if (a.indexOf('?replica') === -1) {
    return 'admin';
  }

  const db = a.substring(a.lastIndexOf('/') + 1, a.lastIndexOf('?replica'));
  if (!db) {
    return 'admin';
  }
  return db;
}

function getMongoConnectionString() {
  return process.env.MONGO_URL;

  if (['production'].includes(process.env.NODE_ENV) || process.env.ENTERPRISE) {
    return process.env.MONGO_URL;
  }

  const database = getDatabase();
  if (!process.env.MONGO_URL.includes(database)) {
    return `${process.env.MONGO_URL}/${database}`;
  }

  return `mongodb://${q.host}/admin`;
}
module.exports = {
  sendgridAPIKey: process.env.SENDGRID_API_KEY || defaults.sendgridApi,
  workerNodeIP: (locationCode = 'us-west-2') => {
    const locationConfig = RemoteConfig.clusters[getNamespace()][locationCode];
    if (!locationConfig) {
      return RemoteConfig.clusters[getNamespace()]['ap-south-1b'].workerNodeIP;
    }
    return locationConfig.workerNodeIP;
  },
  redisHost: RemoteConfig.REDIS_HOST || process.env.REDIS_HOST || defaults.redisHost,
  redisPort: RemoteConfig.REDIS_PORT || process.env.REDIS_PORT || defaults.redisPort,
  apiHost: getAPIHost(),
  database: getDatabase(),
  mongoConnectionString: getMongoConnectionString(),
  getHyperionConnectionDetails: getHyperionConnectionDetails,
  getPaymeterConnectionDetails: getPaymeterConnectionDetails,
  getCoinmarketcapAPIKey: getCoinmarketcapAPIKey,
  getEthplorerAPIKey: getEthplorerAPIKey,
  workerNodeDomainName: (locationCode = 'us-west-2') => {
    return getDynamoWokerDomainName(locationCode);
  },
  kubeRestApiHost: (locationCode = 'us-west-2') => {
    const locationConfig = RemoteConfig.clusters[getNamespace()][locationCode];
    if (!locationConfig) {
      return RemoteConfig.clusters[getNamespace()]['ap-south-1b'].masterAPIHost;
    }
    return locationConfig.masterAPIHost;
  },
  clusterApiAuth: (locationCode = 'us-west-2') => {
    const locationConfig = RemoteConfig.clusters[getNamespace()][locationCode];
    if (!locationConfig) {
      return RemoteConfig.clusters[getNamespace()]['ap-south-1b'].auth;
    }
    return locationConfig.auth;
  },
  namespace: getNamespace(),
  RemoteConfig() {
    return RemoteConfig;
  },
  env: getEnv(),
  RazorPay: {
    id: process.env.RAZORPAY_ID || defaults.razorpay.id,
    secret: process.env.RAZORPAY_KEY || defaults.razorpay.secret,
  },
  NetworkUpdate: {
    id: process.env.NETWORK_UPDATE_ID,
    key: process.env.NETWORK_UPDATE_KEY,
  },
  Zoho: {
    organizationId: process.env.ZOHO_ORGANIZATION_ID || defaults.zoho.organizationId,
    authToken: process.env.ZOHO_AUTH_TOKEN || defaults.zoho.authToken,
  },
  Raven: {
    dsn: (() => {
      if (process.env.NODE_ENV === 'production') {
        return 'https://30e285a684c74bb5a726673ca0cf6707:198e6d34e7094612a771ee388fdad1dd@sentry.io/1274301';
      } else if (process.env.NODE_ENV === 'staging') {
        return 'https://e6be112ac8e343d2b0409d561d578e4e@sentry.io/1275118';
      } else if (process.env.ENABLE_SENTRY) {
        return 'https://4d3e7232bb49468da0eb16c4cb370b5f@sentry.io/1275120';
      }
    })(),
  },
  getImageRepository(imageType = 'dynamo') {
    if (!RemoteConfig.repositories) {
      return '';
    }

    // TODO: Make this enterprise compatible
    if (imageType === 'privatehive-peer') {
      if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        return `402432300121.dkr.ecr.ap-south-1.amazonaws.com/privatehive-peer-api:dev`;
      } else {
        return `402432300121.dkr.ecr.ap-south-1.amazonaws.com/privatehive-peer-api:${process.env.NODE_ENV}`;
      }
    }

    if (imageType === 'privatehive-orderer') {
      if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        return `402432300121.dkr.ecr.ap-south-1.amazonaws.com/privatehive-orderer-api:dev`;
      } else {
        return `402432300121.dkr.ecr.ap-south-1.amazonaws.com/privatehive-orderer-api:${process.env.NODE_ENV}`;
      }
    }

    return `${RemoteConfig.repositories[imageType].url[getNamespace()]}`;
  },
  migrationVersion: MIGRATION_VERSION,
  // locationMapping
};
