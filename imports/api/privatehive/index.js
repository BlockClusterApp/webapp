import moment from 'moment';

import helpers from '../../modules/helpers';
import Config from '../../modules/config/server';
import { PrivatehiveOrderers } from '../../collections/privatehiveOrderers/privatehiveOrderers.js';
import { PrivatehivePeers } from '../../collections/privatehivePeers/privatehivePeers.js';
import Voucher from '../../collections/vouchers/voucher';

String.prototype.toPascalCase = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

let PrivateHive = {};

PrivateHive.createPeer = async () => {
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
                          value: `/etc/hyperledger/privatehive/crypto-config/peerOrganizations/peer.${instanceId.toLowerCase()}.com/users/Admin@peer.${instanceId.toLowerCase()}.com/msp`,
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
                        {
                          name: 'CONFIGTXLATOR_URL',
                          value: 'http://127.0.0.1:7059',
                        },
                        {
                          name: 'MONGO_URL',
                          value: `${process.env.MONGO_URL}`,
                        },
                      ],
                      volumeMounts: [
                        {
                          name: 'privatehive-dir',
                          mountPath: '/etc/hyperledger/privatehive',
                        },
                      ],
                      lifecycle: {
                        postStart: {
                          exec: {
                            command: ['/bin/bash', '-c', 'node postStart.js'],
                          },
                        },
                        preStop: {
                          exec: {
                            command: ['/bin/bash', '-c', 'node preStop.js'],
                          },
                        },
                      },
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

PrivateHive.createOrderer = async (peerOrgName, peerAdminCert, peerCACert, peerWorkerNodeIP, anchorCommPort) => {
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
                          name: 'WORKER_NODE_IP',
                          value: workerNodeIP,
                        },
                        {
                          name: 'ORDERER_PORT',
                          value: ordererNodePort.toString(),
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
                        {
                          name: 'MONGO_URL',
                          value: `${process.env.MONGO_URL}`,
                        },
                      ],
                      lifecycle: {
                        postStart: {
                          exec: {
                            command: ['/bin/bash', '-c', 'node postStart.js'],
                          },
                        },
                        preStop: {
                          exec: {
                            command: ['/bin/bash', '-c', 'node preStop.js'],
                          },
                        },
                      },
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
                        {
                          name: 'GODEBUG',
                          value: 'netdns=go',
                        },
                        {
                          name: 'NAMESPACE',
                          value: Config.namespace,
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

  async function deployZookeeper() {
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
                name: `zk-svc-${instanceId}`,
                labels: {
                  app: `zk-svc-${instanceId}`,
                },
              },
              spec: {
                ports: [
                  {
                    port: 2181,
                    name: 'client',
                  },
                  {
                    port: 2888,
                    name: 'server',
                  },
                  {
                    port: 3888,
                    name: 'leader-election',
                  },
                ],
                clusterIP: 'None',
                selector: {
                  app: `zk-${instanceId}`,
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
              resolve();
            }
          }
        );
      });
    }

    /*async function createPodDistruptionBudget() {
      return new Promise((resolve, reject) => {
        HTTP.call(
          'POST',
          `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/poddisruptionbudgets`,
          {
            content: JSON.stringify({
              apiVersion: 'policy/v1beta1',
              kind: 'PodDisruptionBudget',
              metadata: {
                name: `zk-pdb-${instanceId}`,
              },
              spec: {
                selector: {
                  matchLabels: {
                    app: `zk-${instanceId}`,
                  },
                },
                minAvailable: 2,
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
    }*/

    async function createStatefulSet() {
      return new Promise((resolve, reject) => {
        HTTP.call(
          'POST',
          `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1/namespaces/${Config.namespace}/statefulsets`,
          {
            content: JSON.stringify({
              apiVersion: 'apps/v1',
              kind: 'StatefulSet',
              metadata: {
                name: `zk-${instanceId}`,
              },
              spec: {
                serviceName: `zk-svc-${instanceId}`,
                replicas: 3,
                selector: {
                  matchLabels: {
                    app: `zk-${instanceId}`,
                  },
                },
                template: {
                  metadata: {
                    labels: {
                      app: `zk-${instanceId}`,
                    },
                  },
                  spec: {
                    containers: [
                      {
                        name: 'k8szk',
                        imagePullPolicy: 'Always',
                        image: 'gcr.io/google_samples/k8szk:v3',
                        resources: {
                          requests: {
                            memory: '2Gi',
                            cpu: '500m',
                          },
                        },
                        ports: [
                          {
                            containerPort: 2181,
                            name: 'client',
                          },
                          {
                            containerPort: 2888,
                            name: 'server',
                          },
                          {
                            containerPort: 3888,
                            name: 'leader-election',
                          },
                        ],
                        env: [
                          {
                            name: 'ZK_REPLICAS',
                            value: '3',
                          },
                          {
                            name: 'ZK_HEAP_SIZE',
                            value: '1G',
                          },
                          {
                            name: 'ZK_TICK_TIME',
                            value: '2000',
                          },
                          {
                            name: 'ZK_INIT_LIMIT',
                            value: '10',
                          },
                          {
                            name: 'ZK_SYNC_LIMIT',
                            value: '5',
                          },
                          {
                            name: 'ZK_MAX_CLIENT_CNXNS',
                            value: '60',
                          },
                          {
                            name: 'ZK_SNAP_RETAIN_COUNT',
                            value: '3',
                          },
                          {
                            name: 'ZK_PURGE_INTERVAL',
                            value: '0',
                          },
                          {
                            name: 'ZK_CLIENT_PORT',
                            value: '2181',
                          },
                          {
                            name: 'ZK_SERVER_PORT',
                            value: '2888',
                          },
                          {
                            name: 'ZK_ELECTION_PORT',
                            value: '3888',
                          },
                        ],
                        command: ['sh', '-c', 'zkGenConfig.sh && zkServer.sh start-foreground'],
                        readinessProbe: {
                          exec: {
                            command: ['zkOk.sh'],
                          },
                          initialDelaySeconds: 10,
                          timeoutSeconds: 5,
                        },
                        livenessProbe: {
                          exec: {
                            command: ['zkOk.sh'],
                          },
                          initialDelaySeconds: 10,
                          timeoutSeconds: 5,
                        },
                        volumeMounts: [
                          {
                            name: 'datadir',
                            mountPath: '/var/lib/zookeeper',
                          },
                        ],
                      },
                    ],
                    securityContext: {
                      runAsUser: 1000,
                      fsGroup: 1000,
                    },
                  },
                },
                volumeClaimTemplates: [
                  {
                    metadata: {
                      name: 'datadir',
                    },
                    spec: {
                      storageClassName: 'gp2-storage-class',
                      accessModes: ['ReadWriteOnce'],
                      resources: {
                        requests: {
                          storage: '10Gi',
                        },
                      },
                    },
                  },
                ],
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

    try {
      await createService();
      //await createPodDistruptionBudget();
      await createStatefulSet();
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async function deployKafka() {
    try {
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
                  name: `kafka-svc-${instanceId}`,
                  labels: {
                    app: `kafka-svc-${instanceId}`,
                  },
                },
                spec: {
                  ports: [
                    {
                      port: 9093,
                      name: 'server',
                    },
                  ],
                  clusterIP: 'None',
                  selector: {
                    app: `kafka-${instanceId}`,
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
                resolve();
              }
            }
          );
        });
      }

      async function createStatefulSet() {
        return new Promise((resolve, reject) => {
          HTTP.call(
            'POST',
            `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1/namespaces/${Config.namespace}/statefulsets`,
            {
              content: `
                apiVersion: apps/v1
                kind: StatefulSet
                metadata:
                  name: kafka-${instanceId}
                spec:
                  serviceName: kafka-svc-${instanceId}
                  replicas: 3
                  selector:
                    matchLabels:
                      app: kafka-${instanceId}
                  template:
                    metadata:
                      labels:
                        app: kafka-${instanceId}
                    spec:
                      terminationGracePeriodSeconds: 300
                      containers:
                      - name: k8skafka
                        imagePullPolicy: Always
                        image: gcr.io/google_samples/k8skafka:v1
                        resources:
                          requests:
                            memory: "1Gi"
                            cpu: 500m
                        ports:
                        - containerPort: 9093
                          name: server
                        command:
                        - sh
                        - -c
                        - "exec kafka-server-start.sh /opt/kafka/config/server.properties --override broker.id=\$\{HOSTNAME##*-\} \
                          --override listeners=PLAINTEXT://:9093 \
                          --override zookeeper.connect=zk-${instanceId}-0.zk-svc-${instanceId}.${Config.namespace}.svc.cluster.local:2181,zk-${instanceId}-1.zk-svc-${instanceId}.${
                Config.namespace
              }.svc.cluster.local:2181,zk-${instanceId}-2.zk-svc-${instanceId}.${Config.namespace}.svc.cluster.local:2181 \
                          --override log.dir=/var/lib/kafka \
                          --override auto.create.topics.enable=true \
                          --override auto.leader.rebalance.enable=true \
                          --override background.threads=10 \
                          --override compression.type=producer \
                          --override delete.topic.enable=false \
                          --override leader.imbalance.check.interval.seconds=300 \
                          --override leader.imbalance.per.broker.percentage=10 \
                          --override log.flush.interval.messages=9223372036854775807 \
                          --override log.flush.offset.checkpoint.interval.ms=60000 \
                          --override log.flush.scheduler.interval.ms=9223372036854775807 \
                          --override log.retention.bytes=-1 \
                          --override log.retention.hours=168 \
                          --override log.roll.hours=168 \
                          --override log.roll.jitter.hours=0 \
                          --override log.segment.bytes=1073741824 \
                          --override log.segment.delete.delay.ms=60000 \
                          --override message.max.bytes=1000012 \
                          --override min.insync.replicas=1 \
                          --override num.io.threads=8 \
                          --override num.network.threads=3 \
                          --override num.recovery.threads.per.data.dir=1 \
                          --override num.replica.fetchers=1 \
                          --override offset.metadata.max.bytes=4096 \
                          --override offsets.commit.required.acks=-1 \
                          --override offsets.commit.timeout.ms=5000 \
                          --override offsets.load.buffer.size=5242880 \
                          --override offsets.retention.check.interval.ms=600000 \
                          --override offsets.retention.minutes=1440 \
                          --override offsets.topic.compression.codec=0 \
                          --override offsets.topic.num.partitions=50 \
                          --override offsets.topic.replication.factor=3 \
                          --override offsets.topic.segment.bytes=104857600 \
                          --override queued.max.requests=500 \
                          --override quota.consumer.default=9223372036854775807 \
                          --override quota.producer.default=9223372036854775807 \
                          --override replica.fetch.min.bytes=1 \
                          --override replica.fetch.wait.max.ms=500 \
                          --override replica.high.watermark.checkpoint.interval.ms=5000 \
                          --override replica.lag.time.max.ms=10000 \
                          --override replica.socket.receive.buffer.bytes=65536 \
                          --override replica.socket.timeout.ms=30000 \
                          --override request.timeout.ms=30000 \
                          --override socket.receive.buffer.bytes=102400 \
                          --override socket.request.max.bytes=104857600 \
                          --override socket.send.buffer.bytes=102400 \
                          --override unclean.leader.election.enable=true \
                          --override zookeeper.session.timeout.ms=6000 \
                          --override zookeeper.set.acl=false \
                          --override broker.id.generation.enable=true \
                          --override connections.max.idle.ms=600000 \
                          --override controlled.shutdown.enable=true \
                          --override controlled.shutdown.max.retries=3 \
                          --override controlled.shutdown.retry.backoff.ms=5000 \
                          --override controller.socket.timeout.ms=30000 \
                          --override default.replication.factor=1 \
                          --override fetch.purgatory.purge.interval.requests=1000 \
                          --override group.max.session.timeout.ms=300000 \
                          --override group.min.session.timeout.ms=6000 \
                          --override inter.broker.protocol.version=0.10.2-IV0 \
                          --override log.cleaner.backoff.ms=15000 \
                          --override log.cleaner.dedupe.buffer.size=134217728 \
                          --override log.cleaner.delete.retention.ms=86400000 \
                          --override log.cleaner.enable=true \
                          --override log.cleaner.io.buffer.load.factor=0.9 \
                          --override log.cleaner.io.buffer.size=524288 \
                          --override log.cleaner.io.max.bytes.per.second=1.7976931348623157E308 \
                          --override log.cleaner.min.cleanable.ratio=0.5 \
                          --override log.cleaner.min.compaction.lag.ms=0 \
                          --override log.cleaner.threads=1 \
                          --override log.cleanup.policy=delete \
                          --override log.index.interval.bytes=4096 \
                          --override log.index.size.max.bytes=10485760 \
                          --override log.message.timestamp.difference.max.ms=9223372036854775807 \
                          --override log.message.timestamp.type=CreateTime \
                          --override log.preallocate=false \
                          --override log.retention.check.interval.ms=300000 \
                          --override max.connections.per.ip=2147483647 \
                          --override num.partitions=1 \
                          --override producer.purgatory.purge.interval.requests=1000 \
                          --override replica.fetch.backoff.ms=1000 \
                          --override replica.fetch.max.bytes=1048576 \
                          --override replica.fetch.response.max.bytes=10485760 \
                          --override reserved.broker.max.id=1000 "
                        env:
                        - name: KAFKA_HEAP_OPTS
                          value : "-Xmx512M -Xms512M"
                        - name: KAFKA_OPTS
                          value: "-Dlogging.level=INFO"
                        volumeMounts:
                        - name: datadir
                          mountPath: /var/lib/kafka
                        readinessProbe:
                          initialDelaySeconds: 30
                          timeoutSeconds: 5
                          exec:
                            command:
                              - sh
                              - -c
                              - "/opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server=localhost:9093"
                      securityContext:
                        runAsUser: 1000
                        fsGroup: 1000
                  volumeClaimTemplates:
                  - metadata:
                      name: datadir
                    spec:
                      storageClassName: 'gp2-storage-class'
                      accessModes: [ "ReadWriteOnce" ]
                      resources:
                        requests:
                          storage: 10Gi
              `,
              headers: {
                'Content-Type': 'application/yaml',
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

      await createService();
      await createStatefulSet();

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  await deployZookeeper();
  await deployKafka();

  await createPersistentvolumeclaims();
  ordererNodePort = await createService();
  await createDeployment();

  return { instanceId, ordererNodePort };
};

Meteor.methods({
  createPrivatehivePeer: async () => {
    //here we will deploy one peer only based on the given location
    let peerDetails = await PrivateHive.createPeer();

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
    let ordererDetails = await PrivateHive.createOrderer(peerId, certs.adminCert, certs.caCert, peerDetails.workerNodeIP, peerDetails.anchorCommPort);
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
  },
  privatehiveJoinChannel: async (peerId, ordererId, newPeerId, channelName) => {
    let peerDetails = PrivatehivePeers.findOne({
      instanceId: peerId,
    });

    let newPeerDetails = PrivatehivePeers.findOne({
      instanceId: newPeerId,
    });

    let ordererDetails = PrivatehiveOrderers.findOne({
      instanceId: ordererId,
    });

    async function getDetails() {
      return new Promise((resolve, reject) => {
        HTTP.call('GET', `http://${newPeerDetails.workerNodeIP}:${newPeerDetails.apiNodePort}/orgDetails`, {}, (error, response) => {
          if (error) {
            reject();
          } else {
            resolve(response.data);
          }
        });
      });
    }

    async function addNewOrgToChannel(details) {
      return new Promise((resolve, reject) => {
        HTTP.call(
          'POST',
          `http://${peerDetails.workerNodeIP}:${peerDetails.apiNodePort}/addOrgToChannel`,
          {
            data: {
              name: channelName,
              newOrgName: newPeerDetails.instanceId,
              newOrgConf: details.message,
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

    async function joinChannel() {
      return new Promise((resolve, reject) => {
        HTTP.call(
          'POST',
          `http://${newPeerDetails.workerNodeIP}:${newPeerDetails.apiNodePort}/joinChannel`,
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

    let details = await getDetails();
    await addNewOrgToChannel(details);
    await joinChannel();
  },
});

PrivateHive.generateBill = async ({ userId, month, year, isFromFrontend }) => {
  month = month === undefined ? moment().month() : month;
  year = year || moment().year();
  const selectedMonth = moment()
    .year(year)
    .month(month);
  const currentTime = moment();

  let calculationEndDate = selectedMonth.endOf('month').toDate();
  if (currentTime.isBefore(selectedMonth)) {
    calculationEndDate = currentTime.toDate();
  }

  const result = {
    totalAmount: 0,
  };

  const userNetworks = [
    PrivatehiveOrderers.find({
      userId: userId,
      createdAt: {
        $lt: calculationEndDate,
      },
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } },
        {
          deletedAt: {
            $gte: selectedMonth.startOf('month').toDate(),
          },
        },
      ],
    }).fetch(),
    PrivatehivePeers.find({
      userId: userId,
      createdAt: {
        $lt: calculationEndDate,
      },
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } },
        {
          deletedAt: {
            $gte: selectedMonth.startOf('month').toDate(),
          },
        },
      ],
    }).fetch(),
  ];

  result.networks = /* userNetworks */ []
    .map(network => {
      let thisCalculationEndDate = calculationEndDate;
      if (network.deletedAt && moment(network.deletedAt).isBefore(calculationEndDate.getTime())) {
        thisCalculationEndDate = new Date(network.deletedAt);
      }

      let billingStartDate = selectedMonth.startOf('month').toDate();
      if (moment(billingStartDate).isBefore(moment(network.createdAt))) {
        billingStartDate = moment(network.createdAt).toDate();
      }

      const price = Number(network.networkConfig.cost.hourly);

      const time = convertMilliseconds(thisCalculationEndDate.getTime() - billingStartDate.getTime());
      const rate = price; // per month
      const ratePerHour = rate;
      const ratePerMinute = ratePerHour / 60;

      const voucher = network.voucher;

      /**
       * First Time inside Voucher Object voucher_claim_status array is of length 0.
       * when we generate bill after month check if recurring type voucher of not.
       * if recurring type voucher:
       *         check the `voucher.usability.no_months` field conatins value for recurring.
       *         now on applying voucher insert a doc in voucher.voucher_claim_status.
       *         and every time before applying voucher in bill, check this if `voucher.usability.no_months` is less than
       *         the inserted docs in `voucher_claim_status` or not.
       *          if not then understad, limit of recurring is over, dont consider.
       * if not recuring:
       *         after applying voucher we are inserting a doc in the same voucher_claim_status field.
       *         and also every time before applying ,checking if voucher_claim_status legth is 0 or more.
       *         if 0 then that means first time, good to go. if there is any. then dont consider to apply.
       *
       * And Also check for expiry date.
       */
      let voucher_usable;
      let voucher_expired;
      if (voucher) {
        if (!voucher.usability) {
          voucher.usability = {
            recurring: false,
            no_months: 0,
            once_per_user: true,
            no_times_per_user: 1,
          };
        }
        if (!voucher.availability) {
          voucher.availability = {
            card_vfctn_needed: true,
            for_all: false,
            email_ids: [],
          };
        }
        if (!voucher.discount) {
          voucher.discount = {
            value: 0,
            percent: false,
          };
        }

        voucher_usable =
          voucher.usability.recurring == true
            ? voucher.usability.no_months > (voucher.voucher_claim_status ? voucher.voucher_claim_status.length : 0)
              ? true
              : false
            : (voucher.voucher_claim_status
              ? voucher.voucher_claim_status.length
              : false)
            ? false
            : true;

        if (voucher.locationMapping) {
          vouchar_usable = vouchar_usable && !!voucher.locationMapping[network.locationCode];
        }

        voucher_expired = voucher.expiryDate ? new Date(voucher.expiryDate) <= new Date() : false;
      }

      let discountValue = 0;
      let cost = Number(time.hours * ratePerHour + (time.minutes % 60) * ratePerMinute).toFixed(2);

      let label = voucher ? voucher.code : null;

      if (voucher && voucher._id && voucher_usable) {
        let discount = voucher.discount.value || 0;
        if (voucher.discount.percent) {
          //in this case discout value will be percentage of discount.
          cost = cost * ((100 - discount) / 100);
        } else {
          cost = Math.max(cost - discount, 0);
        }
        discountValue = discount;

        //so that we can track record how many times he used.
        //and also helps to validate if next time need to consider voucher or not.
        if (!isFromFrontend) {
          PrivateHiveCollection.update(
            { _id: network._id },
            {
              $push: {
                'voucher.voucher_claim_status': {
                  claimedBy: userId,
                  claimedOn: new Date(),
                  claimed: true,
                },
              },
            }
          );
        }
      }

      let extraDiskStorage = 0;

      const actualNetworkConfig = NetworkConfiguration.find({ _id: network.networkConfig._id, active: { $in: [true, false, null] } }).fetch()[0];

      if (network.networkConfig.orderer.disk > actualNetworkConfig.orderer.disk) {
        extraDiskStorage += Math.max(network.networkConfig.orderer.disk - actualNetworkConfig.orderer.disk, 0);
      }
      if (network.networkConfig.kafka.disk > actualNetworkConfig.kafka.disk) {
        extraDiskStorage += Math.max(network.networkConfig.kafka.disk - actualNetworkConfig.kafka.disk, 0);
      }
      if (network.networkConfig.data.disk > actualNetworkConfig.data.disk) {
        extraDiskStorage += Math.max(network.networkConfig.data.disk - actualNetworkConfig.data.disk, 0);
      }

      const extraDiskAmount = extraDiskStorage * (EXTRA_STORAGE_COST * time.hours);

      // Just a precaution
      if (network.deletedAt && moment(network.deletedAt).isBefore(selectedMonth.startOf('month'))) {
        return undefined;
      }

      result.totalAmount += Number(cost);
      function floorFigure(figure, decimals) {
        if (!decimals) decimals = 3;
        var d = Math.pow(10, decimals);
        return (parseInt(figure * d) / d).toFixed(decimals);
      }
      return {
        name: network.name,
        instanceId: network.instanceId,
        createdOn: new Date(network.createdAt),
        rate: ` $ ${floorFigure(rate, 3)} / hr `, //taking upto 3 decimals , as shown in pricing page
        runtime: `${time.hours}:${time.minutes % 60 < 10 ? `0${time.minutes % 60}` : time.minutes % 60} hrs | ${extraDiskStorage} GB extra`,
        cost,
        time,
        deletedAt: network.deletedAt,
        voucher: voucher,
        networkConfig: network.networkConfig,
        discount: Number(discountValue || 0).toFixed(2),
        label,
        timeperiod: `Started at: ${moment(network.createdOn).format('DD-MMM-YYYY kk:mm')} ${
          network.deletedAt ? ` to ${moment(network.deletedAt).format('DD-MMM-YYYY kk:mm:ss')}` : 'and still running'
        }`,
      };
    })
    .filter(n => !!n);

  result.totalAmount = Math.max(result.totalAmount, 0);

  return result;
};

export default PrivateHive;

//Note: At application layer we have to maintain a unique id for every network. Otherwise when inviting to channel we don't
//know which network to send invite to.
//When creating network or joining network, just create a peer node. Orderers will be added dynamically.

//Meteor.call('createPrivatehivePeer');
//Meteor.call('createPrivatehiveOrderer', 'cvmdruiu');
//Meteor.call('privatehiveCreateChannel', 'wosrhjfg', 'xgnwmbwk', 'channelsample');
//Meteor.call('privatehiveJoinChannel', 'muoygwak', 'moyxsmta', 'djtveuib', 'channelsample');
