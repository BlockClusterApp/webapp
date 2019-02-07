import PrivateHiveCollection from '../../../../collections/privatehive';
import PrivateHiveApis from '../../../../api/privatehive';

const debug = require('debug')('scheduler:bull:create-privatehive');

const CONCURRENCY = 3;

module.exports = bullSystem => {
  const processFunction = job => {
    return new Promise(async resolve => {
      const { _id } = job.data;

      const network = PrivateHiveCollection.find({ _id }).fetch()[0];

      if (!network.nfs.fileSystem) {
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
                  fileSystem: efs.FileSystemId,
                  createdAt: efs.CreationTime,
                  status: efs.LifeCycleState,
                  url: `${efs.FileSystemId}.efs.${network.locationCode}.amazonaws.com`,
                },
              },
            }
          );
          // Wait for 10 seconds for the file system to boot up
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
        const isNFSReady = await PrivateHiveApis.Helpers.isAWS_EFSDriveReady({ FileSystemId: network.nfs.FileSystemId });
        debug('isNFSReady', isNFSReady);
        if (!isNFSReady) {
          // Wait for 10 more seconds for the file system to boot up
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

      await PrivateHiveApis._createPrivateHiveNetwork({
        id: network.instanceId,
        domain: instanceId,
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

  bullSystem.bullJobs.process('create-privatehive-node', CONCURRENCY, processFunction);
};
