import bullSystem from '../';
import { Networks } from '../../../collections/networks/networks';

module.exports = function() {
  bullSystem.bullJobs.process('start-repull-image', (job, done) => {
    const networks = Networks.find({
      active: true,
      deletedAt: {
        $ne: null
      }
    });
    networks.forEach(network => {
      bullSystem.addJob('repull-image', {
        instanceId: network.instanceId,
        newImageTag: job.imageTag,
        container: job.container
      });
    });
    done();
  });
}
