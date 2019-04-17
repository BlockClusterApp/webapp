const fetchRedis = require('./redis');

const OperationMapping = {
  'create-network': {
    // 3 request per minute
    interval: 1 * 60 * 1000,
    rate: 3,
  },
  'paymeter-api': {
    // 60 requests per minute
    interval: 1 * 60 * 1000,
    rate: 120,
  },
  'hyperion-api': {
    // 10 requests per minute
    interval: 1 * 60 * 1000,
    rate: 120,
  },
  'platform-api': {
    interval: 1 * 60 * 1000,
    rate: 180,
  },
  // 20 requests per 5 minutes
  'privatehive-api': {
    interval: 5 * 60 * 1000,
    rate: 20,
  },
  'privatehive-create': {
    interval: 1 * 60 * 1000,
    rate: 3,
  },
  default: {
    // 200 operations per minute
    interval: 1 * 60 * 1000,
    rate: 200,
  },
};

const returnValue = {};
(async () => {
  const redis = await fetchRedis();

  returnValue.isAllowed = async function(operation, token) {
    if (!token && operation) {
      token = operation;
      operation = 'default';
    }
    if (!(token && operation)) {
      throw new Error('No token specified for rate limiting');
    }

    const isAllowed = await redis.isOperationAllowed(operation, token, new Date().getTime(), OperationMapping[operation].interval, OperationMapping[operation].rate - 1);
    if (isAllowed === 'true') {
      return true;
    }
    return false;
  };
})();

export default returnValue;
