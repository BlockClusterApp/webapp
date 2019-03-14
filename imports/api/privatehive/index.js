import helpers from '../../modules/helpers';
import Config from '../../modules/config/server';
import { PrivatehiveNetworks } from '../../collections/privatehiveNetworks/privatehiveNetworks.js';
import { PrivatehiveOrderers } from '../../collections/privatehiveOrderers/privatehiveOrderers.js';
import { PrivatehivePeers } from '../../collections/privatehivePeers/privatehivePeers.js';
import { worker } from 'cluster';

String.prototype.toPascalCase = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

let privateHive = {};

privateHive.createPeer = async () => {
  const locationCode = 'us-west-2';
  const instanceId = helpers.instanceIDGenerate();
  const workerNodeIP = Config.workerNodeIP();

  async function createPersistentvolumeclaims() {
    return new Promise((resolve, reject) => {
      HTTP.call(
        'POST',
        `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/persistentvolumeclaims`,
        {
          content: JSON.stringify({
            apiVersion: 'v1',
            kind: 'PersistentVolumeClaim',
            metadata: {
              name: `${instanceId}-pvc`,
            },
            spec: {
              accessModes: ['ReadWriteOnce'],
              resources: {
                requests: {
                  storage: `50Gi`,
                },
              },
              storageClassName: 'gp2-storage-class',
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
        (err, response) => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        }
      );
    });
  }

  async function createService() {
    return new Promise((resolve, reject) => {
      HTTP.call(
        'POST',
        `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services`,
        {
          content: JSON.stringify({
            apiVersion: 'v1',
            kind: 'Service',
            metadata: {
              name: `${instanceId}-privatehive`,
            },
            spec: {
              type: 'NodePort',
              ports: [
                {
                  port: 3000,
                  targetPort: 3000,
                  name: 'privatehive-api',
                },
                {
                  port: 7051,
                  targetPort: 7051,
                  name: 'peer',
                },
                {
                  port: 7054,
                  targetPort: 7054,
                  name: 'ca',
                },
              ],
              selector: {
                app: `${instanceId}-privatehive`,
              },
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
        (err, response) => {
          if (err) {
            reject();
          } else {
            HTTP.call('GET', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + instanceId + '-privatehive', {}, (error, response) => {
              if (error) {
                reject();
              } else {
                const peerAPINodePort = response.data.spec.ports[0].nodePort;
                const peerGRPCAPINodePort = response.data.spec.ports[1].nodePort;
                resolve({ peerAPINodePort, peerGRPCAPINodePort });
              }
            });
          }
        }
      );
    });
  }

  async function createDeployment(anchorCommPort) {
    return new Promise((resolve, reject) => {
      HTTP.call(
        'POST',
        `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta1/namespaces/${Config.namespace}/deployments`,
        {
          content: JSON.stringify({
            apiVersion: 'apps/v1beta1',
            kind: 'Deployment',
            metadata: {
              name: `${instanceId}-privatehive`,
              labels: {
                app: `${instanceId}-privatehive`,
              },
            },
            spec: {
              replicas: 1,
              template: {
                metadata: {
                  labels: {
                    app: `${instanceId}-privatehive`,
                    appType: 'privatehive',
                  },
                },
                spec: {
                  containers: [
                    {
                      name: 'privatehive-api',
                      image: '402432300121.dkr.ecr.ap-south-1.amazonaws.com/privatehive-peer-api:latest',
                      ports: [
                        {
                          containerPort: 3000,
                        },
                      ],
                      env: [
                        {
                          name: 'ORG_NAME',
                          value: `${instanceId.toPascalCase()}`,
                        },
                        {
                          name: 'SHARE_FILE_DIR',
                          value: '/etc/hyperledger/privatehive',
                        },
                        {
                          name: 'GOPATH',
                          value: '/opt/gopath',
                        },
                        {
                          name: 'CORE_VM_ENDPOINT',
                          value: 'unix:///host/var/run/docker.sock',
                        },
                        {
                          name: 'CORE_LOGGING_LEVEL',
                          value: 'info',
                        },
                        {
                          name: 'CORE_PEER_ID',
                          value: 'cli',
                        },
                        {
                          name: 'CORE_PEER_ADDRESS',
                          value: 'localhost:7051',
                        },
                        {
                          name: 'CORE_PEER_LOCALMSPID',
                          value: `${instanceId.toPascalCase()}`,
                        },
                        {
                          name: 'CORE_PEER_MSPCONFIGPATH',
                          value: `/etc/hyperledger/privatehive/crypto-config/peerOrganizations/crypto-config/peer.${instanceId.toLowerCase()}.com/users/Admin@peer.${instanceId.toLowerCase()}.com/msp`,
                        },
                        {
                          name: 'CORE_CHAINCODE_KEEPALIVE',
                          value: `10`,
                        },
                        {
                          name: 'WORKER_NODE_IP',
                          value: workerNodeIP,
                        },
                        {
                          name: 'ANCHOR_PORT',
                          value: anchorCommPort.toString(),
                        },
                      ],
                      volumeMounts: [
                        {
                          name: 'privatehive-dir',
                          mountPath: '/etc/hyperledger/privatehive',
                        },
                      ],
                    },
                    {
                      name: 'peer',
                      image: 'hyperledger/fabric-peer',
                      args: ['peer', 'node', 'start'],
                      ports: [
                        {
                          containerPort: 7051,
                          containerPort: 7053,
                        },
                      ],
                      workingDir: '/opt/gopath/src/github.com/hyperledger/fabric/peer',
                      env: [
                        {
                          name: 'CORE_VM_ENDPOINT',
                          value: 'unix:///host/var/run/docker.sock',
                        },
                        {
                          name: 'CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE',
                          value: 'artifacts_default',
                        },
                        {
                          name: 'CORE_LOGGING_LEVEL',
                          value: 'DEBUG',
                        },
                        {
                          name: 'CORE_PEER_MSPCONFIGPATH',
                          value: `/etc/hyperledger/privatehive/crypto-config/peerOrganizations/peer.${instanceId.toLowerCase()}.com/peers/peer0.peer.${instanceId.toLowerCase()}.com/msp`,
                        },
                        {
                          name: 'CORE_PEER_TLS_ENABLED',
                          value: 'false',
                        },
                        {
                          name: 'CORE_PEER_ID',
                          value: `peer0.peer.${instanceId.toLowerCase()}.com`,
                        },
                        {
                          name: 'CORE_PEER_LOCALMSPID',
                          value: `${instanceId.toPascalCase()}`,
                        },
                        {
                          name: 'CORE_PEER_ADDRESS',
                          value: `localhost:7051`,
                        },
                        {
                          name: 'CORE_PEER_GOSSIP_EXTERNALENDPOINT',
                          value: workerNodeIP + ':' + anchorCommPort,
                        },
                      ],
                      volumeMounts: [
                        {
                          name: 'privatehive-dir',
                          mountPath: '/etc/hyperledger/privatehive',
                        },
                      ],
                    },
                    {
                      name: 'ca',
                      image: 'hyperledger/fabric-ca',
                      command: ['sh'],
                      args: ['-c', 'fabric-ca-server start -b admin:adminpw -d'],
                      ports: [
                        {
                          containerPort: 7051,
                        },
                      ],
                      env: [
                        {
                          name: 'FABRIC_CA_HOME',
                          value: '/etc/hyperledger/fabric-ca-server',
                        },
                        {
                          name: 'FABRIC_CA_SERVER_CA_NAME',
                          value: `ca-${instanceId.toLowerCase()}`,
                        },
                        {
                          name: 'FABRIC_CA_SERVER_CA_CERTFILE',
                          value: `/etc/hyperledger/privatehive/crypto-config/peerOrganizations/peer.${instanceId.toLowerCase()}.com/ca/ca.peer.${instanceId.toLowerCase()}.com-cert.pem`,
                        },
                        {
                          name: 'FABRIC_CA_SERVER_CA_KEYFILE',
                          value: `/etc/hyperledger/privatehive/crypto-config/peerOrganizations/peer.${instanceId.toLowerCase()}.com/ca/privateKey`,
                        },
                        {
                          name: 'FABRIC_CA_SERVER_TLS_ENABLED',
                          value: 'false',
                        },
                      ],
                      volumeMounts: [
                        {
                          name: 'privatehive-dir',
                          mountPath: '/etc/hyperledger/privatehive',
                        },
                      ],
                    },
                  ],
                  volumes: [
                    {
                      name: 'privatehive-dir',
                      persistentVolumeClaim: {
                        claimName: `${instanceId}-pvc`,
                      },
                    },
                  ],
                  imagePullSecrets: [
                    {
                      name: 'blockcluster-regsecret',
                    },
                  ],
                },
              },
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
        err => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        }
      );
    });
  }

  await createPersistentvolumeclaims();
  let peerDetails = await createService();
  await createDeployment(peerDetails.peerGRPCAPINodePort);

  return { instanceId, peerDetails };
};

privateHive.createOrderer = async (peerOrgName, peerAdminCert, peerCACert, peerWorkerNodeIP, anchorCommPort) => {
  const locationCode = 'us-west-2';
  const workerNodeIP = Config.workerNodeIP();
  const instanceId = helpers.instanceIDGenerate();
  let ordererNodePort = null;

  async function createPersistentvolumeclaims() {
    return new Promise((resolve, reject) => {
      HTTP.call(
        'POST',
        `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/persistentvolumeclaims`,
        {
          content: JSON.stringify({
            apiVersion: 'v1',
            kind: 'PersistentVolumeClaim',
            metadata: {
              name: `${instanceId}-pvc`,
            },
            spec: {
              accessModes: ['ReadWriteOnce'],
              resources: {
                requests: {
                  storage: `50Gi`,
                },
              },
              storageClassName: 'gp2-storage-class',
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
        (err, response) => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        }
      );
    });
  }

  async function createService() {
    return new Promise((resolve, reject) => {
      HTTP.call(
        'POST',
        `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services`,
        {
          content: JSON.stringify({
            apiVersion: 'v1',
            kind: 'Service',
            metadata: {
              name: `${instanceId}-privatehive`,
            },
            spec: {
              type: 'NodePort',
              ports: [
                {
                  port: 7050,
                  targetPort: 7050,
                  name: 'orderer',
                },
              ],
              selector: {
                app: `${instanceId}-privatehive`,
              },
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
        (err, response) => {
          if (err) {
            reject();
          } else {
            HTTP.call('GET', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + instanceId + '-privatehive', {}, (error, response) => {
              if (error) {
                reject();
              } else {
                const ordererNodePort = response.data.spec.ports[0].nodePort;
                resolve(ordererNodePort);
              }
            });
          }
        }
      );
    });
  }

  async function createDeployment() {
    return new Promise((resolve, reject) => {
      HTTP.call(
        'POST',
        `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta1/namespaces/${Config.namespace}/deployments`,
        {
          content: JSON.stringify({
            apiVersion: 'apps/v1beta1',
            kind: 'Deployment',
            metadata: {
              name: `${instanceId}-privatehive`,
              labels: {
                app: `${instanceId}-privatehive`,
              },
            },
            spec: {
              replicas: 1,
              template: {
                metadata: {
                  labels: {
                    app: `${instanceId}-privatehive`,
                    appType: 'privatehive',
                  },
                },
                spec: {
                  containers: [
                    {
                      name: 'privatehive-api',
                      image: '402432300121.dkr.ecr.ap-south-1.amazonaws.com/privatehive-orderer-api:latest',
                      ports: [
                        {
                          containerPort: 3000,
                        },
                      ],
                      env: [
                        {
                          name: 'ORG_NAME',
                          value: `${instanceId.toPascalCase()}`,
                        },
                        {
                          name: 'SHARE_FILE_DIR',
                          value: '/etc/hyperledger/privatehive',
                        },
                        {
                          name: 'ORDERER_ADDRESS',
                          value: workerNodeIP + ':' + ordererNodePort,
                        },
                        {
                          name: 'PEER_ORG_NAME',
                          //fetch dynamically whatever is the peer org name in the network
                          value: peerOrgName,
                        },
                        {
                          name: 'PEER_ORG_ADMIN_CERT',
                          //this will be fetched dynamically. Th org's network peer details will be fetched and passed to the orderer.
                          value: peerAdminCert,
                        },
                        {
                          name: 'PEER_ORG_CA_CERT',
                          //same like above
                          value: peerCACert,
                        },
                        {
                          name: 'PEER_WORKERNODE_IP',
                          //same like above
                          value: peerWorkerNodeIP,
                        },
                        {
                          name: 'PEER_ANCHOR_PORT',
                          //same like above
                          value: anchorCommPort.toString(),
                        },
                        {
                          name: 'GOPATH',
                          value: '/opt/gopath',
                        },
                        {
                          name: 'CORE_VM_ENDPOINT',
                          value: 'unix:///host/var/run/docker.sock',
                        },
                        {
                          name: 'CORE_LOGGING_LEVEL',
                          value: 'info',
                        },
                        {
                          name: 'CORE_PEER_ID',
                          value: 'cli',
                        },
                        {
                          name: 'CORE_PEER_ADDRESS',
                          value: 'localhost:7051',
                        },
                        {
                          name: 'CORE_PEER_LOCALMSPID',
                          value: `${instanceId.toPascalCase()}`,
                        },
                        {
                          name: 'CORE_PEER_MSPCONFIGPATH',
                          value: `/etc/hyperledger/privatehive/crypto-config/peerOrganizations/crypto-config/peer.${instanceId.toLowerCase()}.com/users/Admin@peer.${instanceId.toLowerCase()}.com/msp`,
                        },
                        {
                          name: 'CORE_CHAINCODE_KEEPALIVE',
                          value: `10`,
                        },
                      ],
                      volumeMounts: [
                        {
                          name: 'privatehive-dir',
                          mountPath: '/etc/hyperledger/privatehive',
                        },
                      ],
                    },
                    {
                      name: 'orderer',
                      image: 'hyperledger/fabric-orderer',
                      command: ['/bin/sh'],
                      args: ['-c', 'orderer'],
                      ports: [
                        {
                          containerPort: 7050,
                        },
                      ],
                      workingDir: '/opt/gopath/src/github.com/hyperledger/fabric/orderers',
                      env: [
                        {
                          name: 'ORDERER_GENERAL_LOGLEVEL',
                          value: 'debug',
                        },
                        {
                          name: 'ORDERER_GENERAL_LISTENADDRESS',
                          value: '0.0.0.0',
                        },
                        {
                          name: 'ORDERER_GENERAL_GENESISMETHOD',
                          value: 'file',
                        },
                        {
                          name: 'ORDERER_GENERAL_GENESISFILE',
                          value: '/etc/hyperledger/privatehive/genesis.block',
                        },
                        {
                          name: 'ORDERER_GENERAL_LOCALMSPID',
                          value: `${instanceId.toPascalCase()}Orderer`,
                        },
                        {
                          name: 'ORDERER_GENERAL_LOCALMSPDIR',
                          value: `/etc/hyperledger/privatehive/crypto-config/ordererOrganizations/orderer.${instanceId.toLowerCase()}.com/users/Admin@orderer.${instanceId.toLowerCase()}.com/msp`,
                        },
                        {
                          name: 'ORDERER_GENERAL_TLS_ENABLED',
                          value: 'false',
                        },
                      ],
                      volumeMounts: [
                        {
                          name: 'privatehive-dir',
                          mountPath: '/etc/hyperledger/privatehive',
                        },
                      ],
                    },
                    {
                      name: 'nginx',
                      image: 'nginx:1.7.9',
                      ports: [
                        {
                          containerPort: 80,
                        },
                      ],
                      volumeMounts: [
                        {
                          name: 'privatehive-dir',
                          mountPath: '/etc/hyperledger/privatehive',
                        },
                      ],
                    },
                  ],
                  volumes: [
                    {
                      name: 'privatehive-dir',
                      persistentVolumeClaim: {
                        claimName: `${instanceId}-pvc`,
                      },
                    },
                  ],
                  imagePullSecrets: [
                    {
                      name: 'blockcluster-regsecret',
                    },
                  ],
                },
              },
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
        err => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        }
      );
    });
  }

  await createPersistentvolumeclaims();
  ordererNodePort = await createService();
  await createDeployment();

  return { instanceId, ordererNodePort };
};

Meteor.methods({
  createPrivatehivePeer: async () => {
    //here we will deploy one peer only based on the given location
    let peerDetails = await privateHive.createPeer();

    PrivatehivePeers.insert({
      instanceId: peerDetails.instanceId,
      workerNodeIP: Config.workerNodeIP(),
      apiNodePort: peerDetails.peerDetails.peerAPINodePort,
      anchorCommPort: peerDetails.peerDetails.peerGRPCAPINodePort,
    });
  },
  createPrivatehiveOrderer: async peerId => {
    let peerDetails = PrivatehivePeers.findOne({
      instanceId: peerId,
    });

    async function getCerts() {
      return new Promise((resolve, reject) => {
        HTTP.call('GET', `http://${peerDetails.workerNodeIP}:${peerDetails.apiNodePort}/channelConfigCerts`, {}, (error, response) => {
          if (error) {
            reject();
          } else {
            resolve(response.data);
          }
        });
      });
    }

    let certs = await getCerts();

    let ordererDetails = await privateHive.createOrderer(peerId, certs.adminCert, certs.caCert, peerDetails.workerNodeIP, peerDetails.anchorCommPort);

    PrivatehiveOrderers.insert({
      instanceId: ordererDetails.instanceId,
      ordererNodePort: ordererDetails.ordererNodePort,
      workerNodeIP: Config.workerNodeIP(),
    });
  },
  privatehiveCreateChannel: async (peerId, ordererId, channelName) => {
    let peerDetails = PrivatehivePeers.findOne({
      instanceId: peerId,
    });

    let ordererDetails = PrivatehiveOrderers.findOne({
      instanceId: ordererId,
    });

    async function createChannel() {
      return new Promise((resolve, reject) => {
        HTTP.call(
          'POST',
          `http://${peerDetails.workerNodeIP}:${peerDetails.apiNodePort}/createChannel`,
          {
            data: {
              name: channelName,
              ordererURL: ordererDetails.workerNodeIP + ':' + ordererDetails.ordererNodePort,
              ordererOrgName: ordererDetails.instanceId,
            },
          },
          (error, response) => {
            if (error) {
              reject();
            } else {
              resolve(response.data);
            }
          }
        );
      });
    }

    await createChannel();

    console.log('Success');
  },
});

//Note: At application layer we have to maintain a unique id for every network. Otherwise when inviting to channel we don't
//know which network to send invite to.
//When creating network or joining network, just create a peer node. Orderers will be added dynamically.

//Meteor.call('createPrivatehivePeer');
//Meteor.call('createPrivatehiveOrderer', 'vflnxhtq');
//Meteor.call('privatehiveCreateChannel', 'vflnxhtq', 'zvlrumum', 'testingchannel');
