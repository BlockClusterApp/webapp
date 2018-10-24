window.RemoteConfig = {};

const CONFIG_URL = `${window.location.origin}/api/config-client`;
async function fetchNewConfig() {
  const response = await fetch(CONFIG_URL);
  const res = await response.json();
  if (res.errorCode && res.errorCode === 404) {
    window.RemoteConfig = {};
  } else {
    window.RemoteConfig = res;
  }
  const event = new Event('RemoteConfigChanged');
  window.dispatchEvent(event);
}

setTimeout(async () => {
  await fetchNewConfig();
}, 1000);

setInterval(async () => {
  await fetchNewConfig();
}, 1 * 60 * 1000);


function getMicroServiceBase() {
  if (process.env.LICENCE_SERVICE_HOST) {
    return process.env.LICENCE_SERVICE_HOST;
  }
  switch (window.location.host) {
    case 'app.blockcluster.io':
      return 'https://enterprise-api.blockcluster.io';
    case 'staging.blockcluster.io':
      return 'https://enterprise-api-staging.blockcluster.io';
    case 'test.blockcluster.io':
      return 'https://enterprise-api-dev.blockcluster.io';
    case 'dev.blockcluster.io':
      return 'https://enterprise-api-dev.blockcluster.io';
    default:
      return 'http://localhost:4000';
  }
}

function getDynamoWokerDomainName(locationCode) {
  if(RemoteConfig.workerDomainName && RemoteConfig.workerDomainName[locationCode]) {
    return RemoteConfig.workerDomainName[locationCode];
  }
  if (window.location.origin.includes('blockcluster.io')) {
    let prefix = '';
    if (locationCode !== 'us-west-2') {
      prefix = `-${locationCode}`;
    }
    const host = window.location.origin.includes('localhost') || window.location.origin.includes('test.blockcluster.io') ? 'https://dev.blockcluster.io' : window.location.origin;
    const url = `${host.split('://')[1].replace('.blockcluster.io', '')}${prefix}.blockcluster.io`;
    return url;
  }
  return "";
}

module.exports = {
  workerNodeDomainName: (locationCode = 'default-1') => {
    return getDynamoWokerDomainName(locationCode);
  },
  namespace: RemoteConfig.NAMESPACE || process.env.NAMESPACE || 'default',
  Raven: {
    dsn: () => {
      if (process.env.NODE_ENV === 'production' || (window && window.location && window.location.origin.includes('https://app.blockcluster.io'))) {
        return 'https://778581990f3e46daaac3995e1e756de5@sentry.io/1274848';
      } else if (process.env.NODE_ENV === 'staging' || (window && window.location && window.location.origin.includes('https://staging.blockcluster.io'))) {
        return 'https://05bdf7f60e944515b1f4a59a79116063@sentry.io/1275121';
      } else if (window && window.location && window.location.origin.includes('https://dev.blockcluster.io')) {
        return 'https://52847e2f5c05463e91789eb2c1b75bcb@sentry.io/1275122';
      }
      return false;
    },
  },
  licensingMicroserviceBase: getMicroServiceBase(),
};
