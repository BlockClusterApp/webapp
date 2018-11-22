import Config from '../../../config/server';
const debug = require('debug')('scheduler:bull:deleteNetwork');

module.exports = function(bullSystem) {

  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async resolve => {
      const { locationCode, instanceId } = job.data;
      const id = instanceId;
      HTTP.call(
        'GET',
        `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3D` + encodeURIComponent('dynamo-node-' + id),
        function(err, response) {
          if (err) return console.log(err);
          const items = JSON.parse(response).items;
          if(!(items && items.length > 0)) {
            return resolve();
          }

          const pod = items[0];
          const status = pod.status.conditions[0].message;
          if(status.includes("persistentvolumeclaim") && status.includes("not found")) {
            HTTP.call(
              'DELETE',
              `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods/` + JSON.parse(response.content).items[0].metadata.name,
              () => {
                return resolve();
              }
            );
          }
          return resolve();
        }
      );
    });
  });

  bullSystem.bullJobs.process('clean-pods', processFunction);
};
