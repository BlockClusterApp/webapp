
const CONCURRENCY = 5;

module.exports = (bullSystem) => {

  const processFunction = (job) => {
    return new Promise(async resolve => {
      const { userId } = job.data;

      return resolve(true);
    });
  }

  bullSystem.bullJobs.process('generate-bill-user', CONCURRENCY, processFunction);
}
