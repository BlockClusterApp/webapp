import helpers from '../../modules/helpers';
import Config from '../../modules/config/server';
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
                        {
                          name: 'GODEBUG',
                          value: 'netdns=go',
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

//Note: At application layer we have to maintain a unique id for every network. Otherwise when inviting to channel we don't
//know which network to send invite to.
//When creating network or joining network, just create a peer node. Orderers will be added dynamically.

//Meteor.call('createPrivatehivePeer');
//Meteor.call('createPrivatehiveOrderer', 'wosrhjfg');
//Meteor.call('privatehiveCreateChannel', 'wosrhjfg', 'xgnwmbwk', 'channelsample');
//Meteor.call('privatehiveJoinChannel', 'muoygwak', 'moyxsmta', 'djtveuib', 'channelsample');
