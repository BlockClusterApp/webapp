const debug = require('debug')('scheduler:bull:deleteNetwork');

module.exports = function(bullSystem) {
  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async resolve => {
      const { locationCode, instanceId } = job.data;
      const id = instanceId;
      try {
        HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/deployments/` + id, kubeCallback);
      } catch (err) {
        console.log(err);
      }

      try {
        HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + id, kubeCallback);
      } catch (err) {
        console.log(err);
      }

      try {
        HTTP.call(
          'GET',
          `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets?labelSelector=app%3D` + encodeURIComponent('dynamo-node-' + id),
          function(err, response) {
            if (err) return console.log(err);
            HTTP.call(
              'DELETE',
              `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets/` + JSON.parse(response.content).items[0].metadata.name,
              () => {}
            );
          }
        );
      } catch (err) {
        console.log(err);
      }

      try {
        HTTP.call(
          'GET',
          `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3D` + encodeURIComponent('dynamo-node-' + id),
          function(err, response) {
            if (err) return console.log(err);
            HTTP.call(
              'DELETE',
              `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods/` + JSON.parse(response.content).items[0].metadata.name,
              () => {}
            );
          }
        );
      } catch (err) {
        console.log(err);
      }

      try {
        HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/persistentvolumeclaims/` + `${id}-pvc`, () => {});
      } catch (err) {
        console.log(err);
      }

      try {
        HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets/` + 'basic-auth-' + id, kubeCallback);
      } catch (err) {
        console.log(err);
      }
      try {
        HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses/` + 'ingress-' + id, kubeCallback);
      } catch (err) {
        console.log(err);
      }
    });
  });

  bullSystem.bullJobs.process('delete-network', processFunction);
};
