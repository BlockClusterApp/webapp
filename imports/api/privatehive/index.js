import helpers from '../../modules/helpers';
import Config from '../../modules/config/server';

String.prototype.toPascalCase = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

Meteor.methods({
  createPrivatehiveOrderer: _ => {
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
                                      value: 'Suvsidof',
                                    },
                                    {
                                      name: 'PEER_ORG_ADMIN_CERT',
                                      //this will be fetched dynamically. Th org's network peer details will be fetched and passed to the orderer.
                                      value:
                                        '-----BEGIN CERTIFICATE-----\nMIICGzCCAcKgAwIBAgIQIz4lZFWBeucza7PJM+aOzzAKBggqhkjOPQQDAjB1MQsw\nCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMNU2FuIEZy\nYW5jaXNjbzEaMBgGA1UEChMRcGVlci5zdXZzaWRvZi5jb20xHTAbBgNVBAMTFGNh\nLnBlZXIuc3V2c2lkb2YuY29tMB4XDTE5MDMxMDIyNTAwMFoXDTI5MDMwNzIyNTAw\nMFowXDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcT\nDVNhbiBGcmFuY2lzY28xIDAeBgNVBAMMF0FkbWluQHBlZXIuc3V2c2lkb2YuY29t\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1b5PXSSH4vSrmi8/y/dYB/NMYD7D\nL3BhQEzHiuIA1tO4R6KxonRzy7Nx7zSZFO2MHsEDP5JmlGShaK7Yqxs7VaNNMEsw\nDgYDVR0PAQH/BAQDAgeAMAwGA1UdEwEB/wQCMAAwKwYDVR0jBCQwIoAgi0piLp4U\nqYzJSyXkiWlY/vMEcrkM+qUq1iPVKLz49T8wCgYIKoZIzj0EAwIDRwAwRAIgNu2T\nlpXiptu/Q0qXtn/rco4KkdEVylrbheEj/73swtACID4Xz7P3KjjBLZbk3Zay8lV5\n01WxU+pbtQA1R7ti9XKk\n-----END CERTIFICATE-----\n',
                                    },
                                    {
                                      name: 'PEER_ORG_CA_CERT',
                                      //same like above
                                      value:
                                        '-----BEGIN CERTIFICATE-----\nMIICRzCCAe2gAwIBAgIQE8SdQJ5rmrq9cGasXeg2XTAKBggqhkjOPQQDAjB1MQsw\nCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMNU2FuIEZy\nYW5jaXNjbzEaMBgGA1UEChMRcGVlci5zdXZzaWRvZi5jb20xHTAbBgNVBAMTFGNh\nLnBlZXIuc3V2c2lkb2YuY29tMB4XDTE5MDMxMDIyNTAwMFoXDTI5MDMwNzIyNTAw\nMFowdTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcT\nDVNhbiBGcmFuY2lzY28xGjAYBgNVBAoTEXBlZXIuc3V2c2lkb2YuY29tMR0wGwYD\nVQQDExRjYS5wZWVyLnN1dnNpZG9mLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEH\nA0IABNsEXvZTChdwlFaqRE6v+45H1fPRsmtHwQklhz0lqDC0SdJ8Ti4eTElplBWt\nYa2TVmdKttYLWf21KQRA5MycpgGjXzBdMA4GA1UdDwEB/wQEAwIBpjAPBgNVHSUE\nCDAGBgRVHSUAMA8GA1UdEwEB/wQFMAMBAf8wKQYDVR0OBCIEIItKYi6eFKmMyUsl\n5IlpWP7zBHK5DPqlKtYj1Si8+PU/MAoGCCqGSM49BAMCA0gAMEUCIQDlkb/wXjtf\njbjY5d0iVaAJR5Y9DKcf6W+M9NBB9NdX0QIgRXLySAQiX68ImW3e0C6z6IP5WNIS\nrdii51h99FwiZGM=\n-----END CERTIFICATE-----\n',
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
  createPrivatehivePeer: ordererAddress => {
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
                      port: 7051,
                      targetPort: 7051,
                      name: 'peer',
                    },
                    {
                      port: 7054,
                      targetPort: 7054,
                      name: 'ca',
                    },
                    {
                      port: 3000,
                      targetPort: 3000,
                      name: 'privatehive-api',
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
                });
              }
            }
          );
        }
      }
    );
  },
});

//Note: At application layer we have to maintain a unique id for every network. Otherwise when inviting to channel we don't
//know which network to send invite to.
//When creating network or joining network, just create a peer node. Orderers will be added dynamically.

//Meteor.call('createPrivatehiveOrderer');
//Meteor.call('createPrivatehivePeer');
