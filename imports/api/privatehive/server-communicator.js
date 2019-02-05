const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

console.log('Proto file path', Assets.absoluteFilePath('protos/privatehive.proto'));

const packageDefinition = protoLoader.loadSync(Assets.absoluteFilePath('protos/privatehive/privatehive.proto'), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const packageDescriptor = grpc.loadPackageDefinition(packageDefinition);
const { privatehive } = packageDescriptor;

if (process.env.NODE_ENV === 'development') {
  process.env.PRIVATEHIVE_SERVICE_GRPC_URL = process.env.PRIVATEHIVE_SERVICE_GRPC_URL || 'localhost:19596';
}

if (!(process.env.PRIVATEHIVE_SERVICE_GRPC_URL || process.env.NO_PRIVATEHIVE)) {
  throw new Error('PRIVATEHIVE_SERVICE_GRPC_URL env is required for privatehive to start');
}

// stub contains all the service functions defined in the protobuf def.
const stub = new privatehive.PrivateHiveService(process.env.PRIVATEHIVE_SERVICE_GRPC_URL, grpc.credentials.createInsecure());

// Example on how to call
/*
stub.CreatePrivateHive(
  {
    id: 'jibin',
    domain: 'jibin',
    locationCode: 'us-west-2',
    kafkaDiskSpace: 200,
    efsServer: 'fs-80deba28.efs.us-west-2.amazonaws.com',
    ordererDiskSpace: 200,
    organizations: ['jibin'],
    domains: ['jibin'],
  },
  (err, response) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`Response: ${JSON.stringify(response)}`);
    }
  }
);
*/

module.exports = stub;
