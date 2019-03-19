import Redis from 'ioredis';
const config = require('../../config/server');
let redisClient;

function initializeRedis() {
  return new Promise(resolve => {
    redisClient = new Redis({
      port: config.redisPort,
      host: config.redisHost,
    });

    redisClient.on('connect', () => {
      console.log('Redis connected');
      resolve();
    });
  });
}

module.exports = async () => {
  if (redisClient) {
    return redisClient;
  } else {
    await initializeRedis();
    return redisClient;
  }
};
