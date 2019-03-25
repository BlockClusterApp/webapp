import PrivateHiveCollection from '../../../../collections/privatehive';
import PrivateHiveApis from '../../../../api/privatehive/old_index.js';

const debug = require('debug')('scheduler:bull:create-privatehive');

const CONCURRENCY = 3;

module.exports = bullSystem => {
  const processFunction = job => {
    return new Promise(async resolve => {
      debug('Starting create privatehive worker', job.data);
      const { _id } = job.data;

      const network = PrivateHiveCollection.find({ _id }).fetch()[0];

      if (!network) {
        ElasticLogger.log('Privatehive: Network deleted before creating artifacts', { _id });
        return resolve();
      }

      if (!network.nfs.FileSystemId) {
        // NFS Server does not exists. Create one
        try {
          const efs = await PrivateHiveApis.Helpers.createAWS_EFSDrive({ instanceId: network.instanceId, locationCode: network.locationCode });
          PrivateHiveCollection.update(
            {
              _id,
            },
            {
              $set: {
                nfs: {
                  FileSystemId: efs.FileSystemId,
                  CreationTime: efs.CreationTime,
                  LifeCycleState: efs.LifeCycleState,
                  url: `${efs.FileSystemId}.efs.${network.locationCode}.amazonaws.com`,
                },
              },
            }
          );
          // Wait for 10 seconds for the file system to boot up
          debug('Wait 10 seconds for file system to boot up');
          bullSystem.addJob(
            'create-privatehive-node',
            {
              _id,
            },
            { delay: 10 * 1000 }
          );
          return resolve(true);
        } catch (err) {
          debug('Create NFS Error', err);
          ElasticLogger.log('Error creating efs server', { _id, err });
          PrivateHiveCollection.update(
            {
              _id,
            },
            {
              $set: {
                status: 'failed',
                error: err.toString(),
              },
            }
          );
          throw new Error('Error creating NFS. Rerun after backoff');
        }
      }

      // NFS exists. Check if it is up and running
      try {
        const isNFSReady = await PrivateHiveApis.Helpers.isAWS_EFSDriveReady({ FileSystemId: network.nfs.FileSystemId, locationCode: network.locationCode });
        debug('isNFSReady', isNFSReady);
        if (!isNFSReady) {
          // Wait for 10 more seconds for the file system to boot up
          debug('NFS not ready. Waiting 10 more seconds', { _id: network._id, FileSystemId: network.nfs.FileSystemId });
          return bullSystem.addJob(
            'create-privatehive-node',
            {
              _id,
            },
            { delay: 10 * 1000 }
          );
        }
      } catch (err) {
        debug('NFS Wait Error', err);
        if (err.toString().includes('being deleted')) {
          PrivateHiveCollection.update(
            {
              _id,
            },
            {
              $set: {
                status: 'failed',
                error: 'Storage servers are being deleted',
              },
            }
          );
          ElasticLogger.log('EFS in deleting state', { _id });
          return resolve(false);
        }
        ElasticLogger.log('Error checking NFS Ready', { _id, err });
        throw new Error('Error checking NFS. Rerun after backoff');
      }

      debug('Creating privatehive');
      await PrivateHiveApis._createPrivateHiveNetwork({
        id: network.instanceId,
        domain: network.instanceId,
        locationCode: network.locationCode,
        kafka: network.networkConfig.kafka,
        orderer: network.networkConfig.orderer,
        peer: network.networkConfig.peer,
        fabric: network.networkConfig.fabric,
        data: network.networkConfig.data,
        nfsServer: network.nfs.url,
      });

      return resolve(true);
    });
  };

  bullSystem.bullJobs.process('create-privatehive-node', processFunction);
};
