import { Networks } from "../../../collections/networks/networks";

module.exports = function(bullSystem) {
  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(resolve => {
      console.log("Starting image pull", job.data);
      const networks = Networks.find({
        active: true,
        deletedAt: null
      }).fetch();
      console.log("Netwoks to restart ", networks.map(i => i.instanceId));
      networks.forEach(network => {
        bullSystem.addJob("repull-image", {
          instanceId: network.instanceId,
          locationCode: network.locationCode,
          newImageTag: job.data.imageTag,
          container: job.data.container
        });
      });
      resolve();
    });
  });
  bullSystem.bullJobs.process("start-repull-images", 1, processFunction);
};
