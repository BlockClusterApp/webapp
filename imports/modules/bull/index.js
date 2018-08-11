
'use strict';
import Bull from 'bull';

import Config from '../config/server';

const env = process.env.NODE_ENV || 'dev';

let removeOnComplete = true;
const host = Config.redisHost;
const port = Config.redisPort;


let bullPrefix = 'bull-default';


if (env === 'production') {
  bullPrefix = '{bull-production}';
} else if (env === 'staging') {
  bullPrefix = '{bull-staging}';
} else if (env === 'test'){
  bullPrefix = '{bull-test}'
} else if (env === 'dev') {
  bullPrefix = '{bull-dev}'
} else {
  bullPrefix = '{bull-job}';
}

const bullSystem = {};

bullSystem.initBull = function() {
  const queue = new Bull('queue', { redis: { port, host }, prefix: bullPrefix });

  bullSystem.bullJobs = queue;

  bullSystem.addJob = (
    name,
    data,
    { attempts = 3, delay = 0, timeout = 120000, backOffDelay = 10000, jobId } = {}
  ) => {
    const jobOptions = {
      attempts,
      backoff: { type: 'fixed', delay: backOffDelay },
      delay,
      timeout,
      removeOnComplete,
      jobId,
    };
    return queue.add(name, data, jobOptions);
  };

  queue.on('error', error => {
    console.log("Bull error", error);
  });

  queue.on('active', job => {
    // log worker start
    // console.log("Worker active", job);
  });

  queue.on('completed', (job, result) => {
   // log worker completed
  //  console.log("Worker completed", job);
  });

  queue.on('failed', (job, err) => {
    // log worker failed
    // console.log("Bull worker failed", job, err);
  });

  bullSystem.startBullWorkers = function(system) {
    if (bullSystem.bullJobs) {
      console.log('Starting Bull Workers');
      require('./workers')(system)
    }
  };

  bullSystem.startBullWorkers(bullSystem);
};

bullSystem.initBull();

export default bullSystem;
