import bullSystem from '../';
import { Networks } from '../../../collections/networks/networks';
import Config from '../../config/server';


const IMAGE_REPULL_CONCURRENCY = 3;

module.exports = function() {
  bullSystem.bullJobs.process(IMAGE_REPULL_CONCURRENCY, 'repull-image', (job, done) => {
    const network = Networks.find({
      instanceId: job.instanceId
    });
    if(!network){
      throw new Error("Network has been deleted before pulling image ", job.instanceId);
    }

    HTTP.get(`${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3Ddynamo-node-${job.instanceId}`, (err, res) => {
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

          // wait 10 seconds. We don't want to overload the kube api server
          setTimeout(() => done(), 10 * 1000);
        });
      });
    });

  });
}
