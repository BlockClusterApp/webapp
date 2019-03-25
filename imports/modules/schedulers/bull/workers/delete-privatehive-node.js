import PrivateHiveCollection from '../../../../collections/privatehive';
import PrivateHiveApis from '../../../../api/privatehive/old_index.js';

const debug = require('debug')('scheduler:bull:create-privatehive');

const CONCURRENCY = 3;

module.exports = bullSystem => {
  const processFunction = job => {
    return new Promise(async resolve => {
      debug('Starting delete privatehive worker', job.data);
      const { _id } = job.data;

      const network = PrivateHiveCollection.find({ _id, status: { $ne: 'deleted' } }).fetch()[0];

      if (!network) {
        ElasticLogger.log('Privatehive: Network deleted before deleting artifacts', { _id });
        return resolve();
      }

      debug('Deleting privatehive', {
        id: network.instanceId.split('-')[1],
        domain: network.instanceId.split('-')[1],
        locationCode: network.locationCode,
        nfsServer: network.nfs.url,
      });
      await PrivateHiveApis._deletePrivateHiveNetwork({
        id: network.instanceId.split('-')[1],
        domain: network.instanceId.split('-')[1],
        locationCode: network.locationCode,
        nfsServer: network.nfs.url,
      });

      return resolve(true);
    });
  };

  bullSystem.bullJobs.process('delete-privatehive-node', processFunction);
};
