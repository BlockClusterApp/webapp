import PrivateHiveCollection from '../../../../collections/privatehive';
import PrivateHiveApis from '../../../../api/privatehive';

const debug = require('debug')('scheduler:bull:create-privatehive');

const CONCURRENCY = 3;

module.exports = bullSystem => {
  const processFunction = job => {
    return new Promise(async resolve => {
      debug('Starting join privatehive worker', job.data);
      const { _id, ordererId } = job.data;

      const network = PrivateHiveCollection.find({ _id, deletedAt: null }).fetch()[0];

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
            'join-privatehive-node',
            {
              _id,
              ordererId,
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
            'join-privatehive-node',
            {
              _id,
              ordererId,
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

      const orderer = PrivateHiveCollection.find({ _id: ordererId, deletedAt: null }).fetch()[0];

      if (!orderer) {
        ElasticLogger.log('Orderer network deleted before joining', { _id, ordererId });
        return resolve();
      }
      debug('Joining privatehive');
      await PrivateHiveApis._joinPrivateHiveNetwork({
        id: network.instanceId.split('-')[1],
        domain: network.instanceId.split('-')[1],
        locationCode: network.locationCode,
        peer: network.networkConfig.peer,
        fabric: network.networkConfig.fabric,
        data: network.networkConfig.data,
        nfsServer: network.nfs.url,
        orderer: {
          id: orderer.instanceId.split('-')[1],
          domain: orderer.instanceId.split('-')[1],
          locationCode: orderer.locationCode,
          nfsServer: orderer.nfs.url,
        },
      });

      return resolve(true);
    });
  };

  bullSystem.bullJobs.process('join-privatehive-node', processFunction);
};
