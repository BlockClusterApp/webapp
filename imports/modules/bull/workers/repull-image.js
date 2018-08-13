import { Networks } from '../../../collections/networks/networks';
import Config from '../../config/server';


const IMAGE_REPULL_CONCURRENCY = 3;

module.exports = function(bullSystem) {

  const processFunction = Meteor.bindEnvironment(function(job) {
    console.log("Pulling image", job.data);
    const network = Networks.find({
      instanceId: job.data.instanceId
    }).fetch()[0];
    if(!network){
      throw new Error("Network has been deleted before pulling image ", job.instanceId);
    }
    const locationCode = network.locationCode;
    HTTP.get(`${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3Ddynamo-node-${network.instanceId}`, (err, res) => {
      if(err){
        throw new Error(`Repull image failed for ${job.instanceId} - ${JSON.stringify(err)}`);
      }
      const podList = JSON.parse(res.content);
      podList.items.forEach(pod => {
        const name = pod.metadata.name;
        HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods/${name}`, function(error, response) {
          if(error) {
            throw new Error(`Error deleting pod ${pod.name} - ${JSON.stringify(error)}`);
          }
          console.log("Deleted pod ", name);
          // wait 60 seconds. We don't want to overload the kube api server
          setTimeout(() => done(), 60 * 1000);
        });
      });
    });
  });

  bullSystem.bullJobs.process('repull-image', 2, processFunction);
}
