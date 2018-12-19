import Config from '../../../config/server';
const debug = require('debug')('scheduler:bull:deleteNetwork');

function sleep(time) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), time);
  });
}

module.exports = function(bullSystem) {
  function kubeCallback(err, res) {
    if (err) {
      console.log(err);
    }
  }

  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async resolve => {
      const { locationCode, instanceId, namespace } = job.data;
      const id = instanceId;
      bullSystem.addJob(
        'clean-pods',
        {
          locationCode,
          instanceId,
        },
        {
          delay: 5 * 60 * 1000,
        }
      );
      try {
        HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${namespace}/deployments/` + id, kubeCallback);
      } catch (err) {
        console.log(err);
      }

      try {
        HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/services/` + id, kubeCallback);
      } catch (err) {
        console.log(err);
      }

      try {
        HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/persistentvolumeclaims/` + `${id}-pvc`, () => {});
      } catch (err) {
        console.log(err);
      }

      try {
        HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/secrets/` + 'basic-auth-' + id, kubeCallback);
      } catch (err) {
        console.log(err);
      }
      try {
        HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${namespace}/ingresses/` + 'ingress-' + id, kubeCallback);
      } catch (err) {
        console.log(err);
      }

      try {
        await sleep(5 * 1000);
        HTTP.call(
          'GET',
          `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${namespace}/replicasets?labelSelector=app%3D` + encodeURIComponent('dynamo-node-' + id),
          function(err, response) {
            if (err) return console.log(err);
            HTTP.call(
              'DELETE',
              `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${namespace}/replicasets/` + JSON.parse(response.content).items[0].metadata.name,
              () => {}
            );
          }
        );
      } catch (err) {
        console.log(err);
      }

      try {
        await sleep(10 * 1000);
        HTTP.call('GET', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/pods?labelSelector=app%3D` + encodeURIComponent('dynamo-node-' + id), function(
          err,
          response
        ) {
          if (err) return console.log(err);
          HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/pods/` + JSON.parse(response.content).items[0].metadata.name, () => {});
        });
      } catch (err) {
        console.log(err);
      }

      console.log(`Deleted network`, id);
      resolve();
    });
  });

  bullSystem.bullJobs.process('delete-network', processFunction);
};
