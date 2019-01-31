const grpc = require('grpc');
const path = require('path');
const protoLoader = require('@grpc/proto-loader');

const PROTO_ROOT_PATH = path.join(__dirname, 'protos');
const PRIVATEHIVE_PROTO = path.join(PROTO_ROOT_PATH, 'privatehive.proto');

const packageDefinition = protoLoader.loadSync(PRIVATEHIVE_PROTO, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const packageDescriptor = grpc.loadPackageDefinition(packageDefinition);
const { privatehive } = packageDescriptor;

if (!(process.env.PRIVATEHIVE_SERVICE_GRPC_URL || process.env.NO_PRIVATEHIVE)) {
  throw new Error('PRIVATEHIVE_SERVICE_GRPC_URL env is required for privatehive to start');
}

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
