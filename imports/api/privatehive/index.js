import helpers from '../../modules/helpers';
import Config from '../../modules/config/server';

String.prototype.toPascalCase = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

Meteor.methods({
  createPrivatehiveNetwork: orgName => {
    const locationCode = 'us-west-2';
    const instanceId = helpers.instanceIDGenerate();
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
          console.log('Error allocating storage');
        } else {
          console.log('PV created successfully');
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
                      targetPort: 'orderer',
                      protocol: 'TCP',
                      name: 'api',
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
                console.log('Error occured while creating service');
              } else {
                console.log('Service created successfully');
                HTTP.call('GET', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + instanceId + '-privatehive', {}, (error, response) => {
                  if (error) {
                    console.log('Error getting service');
                  } else {
                    const ordererNodePort = response.data.spec.ports[0].nodePort;
                    const workerNodeIP = Config.workerNodeIP();

                    HTTP.call('POST', `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta1/namespaces/${Config.namespace}/deployments`, {
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
                                  image: '402432300121.dkr.ecr.ap-south-1.amazonaws.com/privatehive-api:latest',
                                  ports: [
                                    {
                                      containerPort: 3000,
                                    },
                                  ],
                                  env: [
                                    {
                                      name: 'ORG_NAME',
                                      value: `${orgName.toPascalCase()}`,
                                    },
                                    {
                                      name: 'MODE',
                                      value: 'orderer',
                                    },
                                    {
                                      name: 'SHARE_FILE_DIR',
                                      value: '/etc/hyperledger/privatehive',
                                    },
                                    {
                                      name: 'WORKER_NODE_IP',
                                      value: workerNodeIP,
                                    },
                                    {
                                      name: 'ORDERER_PORT',
                                      value: ordererNodePort.toString(),
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
                                      value: `${orgName.toPascalCase()}`,
                                    },
                                    {
                                      name: 'CORE_PEER_MSPCONFIGPATH',
                                      value: `/etc/hyperledger/privatehive/crypto-config/peerOrganizations/crypto-config/peer.${orgName.toLowerCase()}.com/users/Admin@peer.${orgName.toLowerCase()}.com/msp`,
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
                                      value: `${orgName.toPascalCase()}Orderer`,
                                    },
                                    {
                                      name: 'ORDERER_GENERAL_LOCALMSPDIR',
                                      value: `/etc/hyperledger/privatehive/crypto-config/ordererOrganizations/orderer.${orgName.toLowerCase()}.com/users/Admin@orderer.${orgName.toLowerCase()}.com/msp`,
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
                                      value: `/etc/hyperledger/privatehive/crypto-config/peerOrganizations/peer.${orgName.toLowerCase()}.com/peers/peer0.peer.${orgName.toLowerCase()}.com/msp`,
                                    },
                                    {
                                      name: 'CORE_PEER_TLS_ENABLED',
                                      value: 'false',
                                    },
                                    {
                                      name: 'CORE_PEER_ID',
                                      value: `peer0.peer.${orgName.toLowerCase()}.com`,
                                    },
                                    {
                                      name: 'CORE_PEER_LOCALMSPID',
                                      value: `${orgName.toPascalCase()}`,
                                    },
                                    {
                                      name: 'CORE_PEER_ADDRESS',
                                      value: `localhost:7051`,
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
                                      value: `ca-${orgName.toLowerCase()}`,
                                    },
                                    {
                                      name: 'FABRIC_CA_SERVER_CA_CERTFILE',
                                      value: `/etc/hyperledger/privatehive/crypto-config/peerOrganizations/peer.${orgName.toLowerCase()}.com/ca/ca.peer.${orgName.toLowerCase()}.com-cert.pem`,
                                    },
                                    {
                                      name: 'FABRIC_CA_SERVER_CA_KEYFILE',
                                      value: `/etc/hyperledger/privatehive/crypto-config/peerOrganizations/peer.${orgName.toLowerCase()}.com/ca/privateKey`,
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
                    });
                  }
                });
              }
            }
          );
        }
      }
    );
  },
});

//Meteor.call('createPrivatehiveNetwork', 'blockcluster');
