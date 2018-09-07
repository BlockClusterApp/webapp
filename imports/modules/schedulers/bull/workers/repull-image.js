import { Networks } from '../../../../collections/networks/networks';
import Config from '../../../config/server';


const IMAGE_REPULL_CONCURRENCY = 2;

module.exports = function(bullSystem) {

  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(resolve => {
      console.log("Pulling image", job.data);
      const network = Networks.find({
        instanceId: job.data.instanceId
      }).fetch()[0];
      if(!network){
        RavenLogger.log('ImageRepull: Network deleted before pulling image', job.data);
        throw new Error("Network has been deleted before pulling image ", job.data.instanceId);
      }
      const locationCode = network.locationCode;
      HTTP.get(`${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3Ddynamo-node-${network.instanceId}`, (err, res) => {
        if(err){
          RavenLogger.log(err);
          throw new Error(`Repull image failed for ${job.instanceId} - ${JSON.stringify(err)}`);
        }
        const podList = JSON.parse(res.content);
        podList.items.forEach(pod => {
          const name = pod.metadata.name;
          HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods/${name}`, function(error, response) {
            if(error) {
              RavenLogger.log(error);
              throw new Error(`Error deleting pod ${pod.name} - ${JSON.stringify(error)}`);
            }
            console.log("Deleted pod ", name);
            // wait 60 seconds. We don't want to overload the kube api server
            setTimeout(() => !console.log("Finshed job") && resolve(), 60 * 1000);
          });
        });
      });
    });
  });

  bullSystem.bullJobs.process('repull-image', IMAGE_REPULL_CONCURRENCY, processFunction);
}
