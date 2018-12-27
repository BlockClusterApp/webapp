import Config from '../../../config/server';
import IngressStore from '../../../../collections/networks/ingress-store';

const debug = require('debug')('scheduler:bull:disable-ingress');

module.exports = function(bullSystem) {
  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async resolve => {
      const { instanceId, locationCode, userId, namespace } = job.data;

      HTTP.call('GET', `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${namespace}/ingresses/ingress-${instanceId}`, function(err, response) {
        const ingress = JSON.parse(response.content);
        delete ingress.metadata.selfLink;
        delete ingress.metadata.uid;
        delete ingress.metadata.resourceVersion;
        delete ingress.metadata.generation;
        delete ingress.metadata.creationTimestamp;
        delete ingress.status;

        const id = IngressStore.insert({
          instanceId,
          locationCode,
          namespace,
          userId,
          data: JSON.stringify(ingress),
        });

        debug('Ingress store', id);

        ElasticLogger.log('Disable ingress', { instanceId, locationCode, userId, namespace, ingressStore: id });
        try {
          HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${namespace}/ingresses/` + 'ingress-' + instanceId, (err, res) => {
            return resolve();
          });
        } catch (err) {
          console.log(err);
          return resolve();
        }
      });
    });
  });

  bullSystem.bullJobs.process('disable-ingress', processFunction);
};
