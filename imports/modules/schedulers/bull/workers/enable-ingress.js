import Config from '../../../config/server';
import IngressStore from '../../../../collections/networks/ingress-store';

const debug = require('debug')('scheduler:bull:enable-ingress');

module.exports = function(bullSystem) {
  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async (resolve, reject) => {
      const { instanceId, locationCode, userId, namespace } = job.data;

      if (!instanceId) {
        const ingresses = IngressStore.find({
          userId,
        }).fetch();
        ingresses.forEach(ingress => {
          bullSystem.addJob('enable-ingress', {
            instanceId: ingress.instanceId,
            locationCode: ingress.locationCode,
            namespace: ingress.namespace,
            userId: ingress.userId,
          });
        });
        return resolve();
      }

      const ingress = IngressStore.findOne({ instanceId, active: true });

      HTTP.call(
        'POST',
        `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${namespace}/ingresses`,
        {
          content: ingress.data,
          headers: {
            'Content-Type': 'application/json',
          },
        },
        function(err, response) {
          if (err) {
            console.log(err);
            ElasticLogger.log('Error creating ingress back', {
              instanceId,
              userId,
              locationCode,
              namespace,
              err,
            });
            return reject(err);
          }
          debug('Create ingress result', response);
          IngressStore.update(
            {
              _id: ingress._id,
            },
            {
              $set: {
                active: false,
              },
            }
          );
          return resolve();
        }
      );
    });
  });

  bullSystem.bullJobs.process('enable-ingress', processFunction);
};
