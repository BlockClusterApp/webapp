import Config from '../../modules/config/server';
import Bluebird from 'bluebird';
var md5 = require('apache-md5');
const Creators = {};

Creators.createPersistentvolumeclaims = async ({ locationCode, namespace, instanceId, storage }) =>
  new Promise((resolve, reject) => {
    HTTP.call(
      'POST',
      `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/persistentvolumeclaims`,
      {
        content: JSON.stringify({
          apiVersion: 'v1',
          kind: 'PersistentVolumeClaim',
          metadata: {
            name: `${instanceId}-pvc`,
            labels: {
              app: `${instanceId}-privatehive`,
              service: 'privatehive',
            },
          },
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
              requests: {
                storage: `${storage}Gi`,
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
          reject(err);
        } else {
          resolve(response);
        }
      }
    );
  });

Creators.deletePersistentVolumeClaim = function({ locationCode, namespace, name }) {
  return new Promise((resolve, reject) => {
    HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/persistentvolumeclaims/${name}`, (err, res) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

Creators.createPeerService = async function({ locationCode, namespace, instanceId }) {
  return new Promise((resolve, reject) => {
    HTTP.call(
      'POST',
      `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/services`,
      {
        content: JSON.stringify({
          apiVersion: 'v1',
          kind: 'Service',
          metadata: {
            name: `${instanceId}-privatehive`,
            labels: {
              service: 'privatehive',
              app: `${instanceId}--privatehive`,
            },
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
          HTTP.call('GET', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/services/` + instanceId + '-privatehive', {}, (error, response) => {
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
};

Creators.deleteService = function({ locationCode, namespace, name }) {
  return new Promise((resolve, reject) => {
    HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/services/${name}`, (err, res) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

Creators.deleteReplicaSet = function({ locationCode, namespace, name, selfLink }) {
  return new Promise((resolve, reject) => {
    let url;
    if (selfLink) {
      url = `${Config.kubeRestApiHost(locationCode)}${selfLink}`;
    } else {
      url = `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${namespace}/replicasets/${name}`;
    }
    HTTP.call('DELETE', url, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
};

Creators.deletePrivatehiveReplicaSets = function({ locationCode, namespace, instanceId }) {
  return new Promise((resolve, reject) => {
    HTTP.call(
      'GET',
      `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${namespace}/replicasets?labelSelector=app%3D` + encodeURIComponent(`${instanceId}-privatehive`),
      async (err, data) => {
        if (err) {
          return reject(err);
        }
        const res = JSON.parse(data.content);
        if (res.items.length > 0) {
          const promises = [];
          res.items.forEach(rs => {
            promises.push(Creators.deleteReplicaSet({ locationCode, selfLink: rs.metadata.selfLink }));
          });
          await Bluebird.all(promises);
        }
        await Creators.deletePrivatehivePods({ locationCode, namespace, instanceId });
        return resolve();
      }
    );
  });
};

Creators.deletePod = function({ locationCode, namespace, name, selfLink }) {
  return new Promise((resolve, reject) => {
    let url;
    if (selfLink) {
      url = `${Config.kubeRestApiHost(locationCode)}${selfLink}`;
    } else {
      url = `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/pods/${name}`;
    }
    HTTP.call('DELETE', url, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
};

Creators.deletePrivatehivePods = function({ locationCode, namespace, instanceId }) {
  return new Promise((resolve, reject) => {
    HTTP.call(
      'GET',
      `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/pods?labelSelector=app%3D` + encodeURIComponent(`${instanceId}-privatehive`),
      async (err, data) => {
        if (err) {
          return reject(err);
        }
        const res = JSON.parse(data.content);
        if (res.items.length > 0) {
          const promises = [];
          res.items.forEach(rs => {
            promises.push(Creators.deletePod({ locationCode, selfLink: rs.metadata.selfLink }));
          });
          await Bluebird.all(promises);
        }
        return resolve();
      }
    );
  });
};

Creators.deleteDeployment = function({ locationCode, namespace, name }) {
  return new Promise((resolve, reject) => {
    HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta1/namespaces/${namespace}/deployments/${name}`, (err, res) => {
      if (err) {
        return reject(err);
      }
      Creators.deleteVolumesByLabel({ locationCode, namespace, label: `app%3D${name.split('-')[0]}-privatehive` });
      resolve();
    });
  });
};

Creators.createPeerDeployment = async function({ locationCode, namespace, instanceId, anchorCommPort, workerNodeIP }) {
  return new Promise((resolve, reject) => {
    HTTP.call(
      'POST',
      `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta1/namespaces/${namespace}/deployments`,
      {
        content: JSON.stringify({
          apiVersion: 'apps/v1beta1',
          kind: 'Deployment',
          metadata: {
            name: `${instanceId}-privatehive`,
            labels: {
              app: `${instanceId}-privatehive`,
              service: 'privatehive',
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
                initContainers: [
                  {
                    name: 'ledger-path-creator',
                    image: 'alpine',
                    volumeMounts: [
                      {
                        name: 'privatehive-dir',
                        mountPath: '/etc/hyperledger/privatehive',
                      },
                    ],
                    command: ['/bin/sh'],
                    args: ['-c', 'mkdir -p /etc/hyperledger/privatehive/ledgerData'],
                  },
                ],
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
                      {
                        name: 'CORE_PEER_FILESYSTEMPATH',
                        value: '/etc/hyperledger/privatehive/ledgerData',
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
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

Creators.createOrdererService = async ({ locationCode, namespace, instanceId }) => {
  return new Promise((resolve, reject) => {
    HTTP.call(
      'POST',
      `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/services`,
      {
        content: JSON.stringify({
          apiVersion: 'v1',
          kind: 'Service',
          metadata: {
            name: `${instanceId}-privatehive`,
            labels: {
              app: `${instanceId}-privatehive`,
              service: 'privatehive',
            },
          },
          spec: {
            type: 'NodePort',
            ports: [
              {
                port: 7050,
                targetPort: 7050,
                name: 'orderer',
              },
              {
                port: 3000,
                targetPort: 3000,
                name: 'api',
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
          reject(err);
        } else {
          HTTP.call('GET', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/services/` + instanceId + '-privatehive', {}, (error, response) => {
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
};

Creators.deleteStatefulSet = function({ locationCode, namespace, name }) {
  return new Promise((resolve, reject) => {
    HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1/namespaces/${namespace}/statefulsets/${name}`, (err, res) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

Creators.deleteVolumeClaim = function({ locationCode, namespace, name, selfLink }) {
  return new Promise((resolve, reject) => {
    let url;
    if (selfLink) {
      url = `${Config.kubeRestApiHost(locationCode)}${selfLink}`;
    } else {
      url = `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/persistentvolumeclaims/${name}`;
    }
    HTTP.call('DELETE', url, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
};

Creators.deleteVolumesByLabel = async ({ locationCode, namespace, label }) => {
  return new Promise((resolve, reject) => {
    HTTP.call('GET', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/persistentvolumeclaims?labelSelector=${label}`, async (err, data) => {
      if (err) {
        return reject(err);
      }
      const res = JSON.parse(data.content);
      if (res.items.length > 0) {
        const promises = [];
        res.items.forEach(rs => {
          promises.push(Creators.deleteVolumeClaim({ locationCode, selfLink: rs.metadata.selfLink }));
        });
        await Bluebird.all(promises);
      }
      return resolve();
    });
  });
};

Creators.destroyZookeper = async function({ locationCode, namespace, instanceId }) {
  await Creators.deleteService({ locationCode, namespace, name: `zk-svc-${instanceId}` });
  await Creators.deleteStatefulSet({ locationCode, namespace, name: `zk-${instanceId}` });
  await Creators.deleteVolumesByLabel({ locationCode, namespace, label: `app%3Dzk-${instanceId}` });
  return true;
};

Creators.deployZookeeper = async function deployZookeeper({ locationCode, instanceId, namespace }) {
  async function createService() {
    return new Promise((resolve, reject) => {
      HTTP.call(
        'POST',
        `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/services`,
        {
          content: JSON.stringify({
            apiVersion: 'v1',
            kind: 'Service',
            metadata: {
              name: `zk-svc-${instanceId}`,
              labels: {
                app: `zk-svc-${instanceId}`,
                service: 'privatehive',
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
            reject(err);
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
        `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1/namespaces/${namespace}/statefulsets`,
        {
          content: JSON.stringify({
            apiVersion: 'apps/v1',
            kind: 'StatefulSet',
            metadata: {
              name: `zk-${instanceId}`,
              labels: {
                service: 'privatehive',
              },
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
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  try {
    await createService();
    await createStatefulSet();
    return Promise.resolve();
  } catch (e) {
    return Promise.reject(e);
  }
};

Creators.destroyKafka = async function({ locationCode, namespace, instanceId }) {
  await Creators.deleteService({ locationCode, namespace, name: `kafka-svc-${instanceId}` });
  await Creators.deleteStatefulSet({ locationCode, namespace, name: `kafka-${instanceId}` });
  await Creators.deleteVolumesByLabel({ locationCode, namespace, label: `app=kafka-${instanceId}` });
  return true;
};

Creators.deployKafka = async function({ locationCode, namespace, instanceId }) {
  try {
    async function createConfigMap() {
      return new Promise((resolve, reject) => {
        HTTP.call(
          'POST',
          `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/configmaps`,
          {
            content: JSON.stringify({
              kind: 'ConfigMap',
              metadata: {
                name: `broker-config-${instanceId}`,
              },
              apiVersion: 'v1',
              data: {
                'init.sh':
                  '#!/bin/bash\nset -e\nset -x\ncp /etc/kafka-configmap/log4j.properties /etc/kafka/\nKAFKA_BROKER_ID=${HOSTNAME##*-}\nSEDS=("s/#init#broker.id=#init#/broker.id=$KAFKA_BROKER_ID/")\nLABELS="kafka-broker-id=$KAFKA_BROKER_ID"\nANNOTATIONS=""\nhash kubectl 2>/dev/null || {\n  SEDS+=("s/#init#broker.rack=#init#/#init#broker.rack=# kubectl not found in path/")\n} && {\n  ZONE=$(kubectl get node "$NODE_NAME" -o=go-template=\'{{index .metadata.labels "failure-domain.beta.kubernetes.io/zone"}}\')\n  if [ "x$ZONE" == "x<no value>" ]; then\n    SEDS+=("s/#init#broker.rack=#init#/#init#broker.rack=# zone label not found for node $NODE_NAME/")\n  else\n    SEDS+=("s/#init#broker.rack=#init#/broker.rack=$ZONE/")\n    LABELS="$LABELS kafka-broker-rack=$ZONE"\n  fi\n  OUTSIDE_HOST=$(kubectl get node "$NODE_NAME" -o jsonpath=\'{.status.addresses[?(@.type=="InternalIP")].address}\')\n  OUTSIDE_PORT=3240${KAFKA_BROKER_ID}\n  SEDS+=("s|#init#advertised.listeners=PLAINTEXT://#init#|advertised.listeners=PLAINTEXT://:9092,OUTSIDE://${OUTSIDE_HOST}:${OUTSIDE_PORT}|")\n  ANNOTATIONS="$ANNOTATIONS kafka-listener-outside-host=$OUTSIDE_HOST kafka-listener-outside-port=$OUTSIDE_PORT"\n  if [ ! -z "$LABELS" ]; then\n    kubectl -n $POD_NAMESPACE label pod $POD_NAME $LABELS || echo "Failed to label $POD_NAMESPACE.$POD_NAME - RBAC issue?"\n  fi\n  if [ ! -z "$ANNOTATIONS" ]; then\n    kubectl -n $POD_NAMESPACE annotate pod $POD_NAME $ANNOTATIONS || echo "Failed to annotate $POD_NAMESPACE.$POD_NAME - RBAC issue?"\n  fi\n}\nprintf \'%s\\n\' "${SEDS[@]}" | sed -f - /etc/kafka-configmap/server.properties > /etc/kafka/server.properties.tmp\n[ $? -eq 0 ] && mv /etc/kafka/server.properties.tmp /etc/kafka/server.properties',
                'server.properties': `############################# Log Basics #############################\n# A comma seperated list of directories under which to store log files\n# Overrides log.dir\nlog.dirs=/var/lib/kafka/data/topics\n# The default number of log partitions per topic. More partitions allow greater\n# parallelism for consumption, but this will also result in more files across\n# the brokers.\nnum.partitions=12\ndefault.replication.factor=3\nmin.insync.replicas=2\nauto.create.topics.enable=false\n# The number of threads per data directory to be used for log recovery at startup and flushing at shutdown.\n# This value is recommended to be increased for installations with data dirs located in RAID array.\n#num.recovery.threads.per.data.dir=1\n############################# Server Basics #############################\n# The id of the broker. This must be set to a unique integer for each broker.\n#init#broker.id=#init#\n#init#broker.rack=#init#\n############################# Socket Server Settings #############################\n# The address the socket server listens on. It will get the value returned from \n# java.net.InetAddress.getCanonicalHostName() if not configured.\n#   FORMAT:\n#     listeners = listener_name://host_name:port\n#   EXAMPLE:\n#     listeners = PLAINTEXT://your.host.name:9092\n#listeners=PLAINTEXT://:9092\nlisteners=PLAINTEXT://:9092,OUTSIDE://:9094\n# Hostname and port the broker will advertise to producers and consumers. If not set, \n# it uses the value for "listeners" if configured.  Otherwise, it will use the value\n# returned from java.net.InetAddress.getCanonicalHostName().\n#advertised.listeners=PLAINTEXT://your.host.name:9092\n#init#advertised.listeners=PLAINTEXT://#init#\n# Maps listener names to security protocols, the default is for them to be the same. See the config documentation for more details\n#listener.security.protocol.map=PLAINTEXT:PLAINTEXT,SSL:SSL,SASL_PLAINTEXT:SASL_PLAINTEXT,SASL_SSL:SASL_SSL\nlistener.security.protocol.map=PLAINTEXT:PLAINTEXT,SSL:SSL,SASL_PLAINTEXT:SASL_PLAINTEXT,SASL_SSL:SASL_SSL,OUTSIDE:PLAINTEXT\ninter.broker.listener.name=PLAINTEXT\n# The number of threads that the server uses for receiving requests from the network and sending responses to the network\n#num.network.threads=3\n# The number of threads that the server uses for processing requests, which may include disk I/O\n#num.io.threads=8\n# The send buffer (SO_SNDBUF) used by the socket server\n#socket.send.buffer.bytes=102400\n# The receive buffer (SO_RCVBUF) used by the socket server\n#socket.receive.buffer.bytes=102400\n# The maximum size of a request that the socket server will accept (protection against OOM)\n#socket.request.max.bytes=104857600\n############################# Internal Topic Settings  #############################\n# The replication factor for the group metadata internal topics "__consumer_offsets" and "__transaction_state"\n# For anything other than development testing, a value greater than 1 is recommended for to ensure availability such as 3.\n#offsets.topic.replication.factor=1\n#transaction.state.log.replication.factor=1\n#transaction.state.log.min.isr=1\n############################# Log Flush Policy #############################\n# Messages are immediately written to the filesystem but by default we only fsync() to sync\n# the OS cache lazily. The following configurations control the flush of data to disk.\n# There are a few important trade-offs here:\n#    1. Durability: Unflushed data may be lost if you are not using replication.\n#    2. Latency: Very large flush intervals may lead to latency spikes when the flush does occur as there will be a lot of data to flush.\n#    3. Throughput: The flush is generally the most expensive operation, and a small flush interval may lead to excessive seeks.\n# The settings below allow one to configure the flush policy to flush data after a period of time or\n# every N messages (or both). This can be done globally and overridden on a per-topic basis.\n# The number of messages to accept before forcing a flush of data to disk\n#log.flush.interval.messages=10000\n# The maximum amount of time a message can sit in a log before we force a flush\n#log.flush.interval.ms=1000\n############################# Log Retention Policy #############################\n# The following configurations control the disposal of log segments. The policy can\n# be set to delete segments after a period of time, or after a given size has accumulated.\n# A segment will be deleted whenever *either* of these criteria are met. Deletion always happens\n# from the end of the log.\n# https://cwiki.apache.org/confluence/display/KAFKA/KIP-186%3A+Increase+offsets+retention+default+to+7+days\noffsets.retention.minutes=10080\n# The minimum age of a log file to be eligible for deletion due to age\nlog.retention.hours=-1\n# A size-based retention policy for logs. Segments are pruned from the log unless the remaining\n# segments drop below log.retention.bytes. Functions independently of log.retention.hours.\n#log.retention.bytes=1073741824\n# The maximum size of a log segment file. When this size is reached a new log segment will be created.\n#log.segment.bytes=1073741824\n# The interval at which log segments are checked to see if they can be deleted according\n# to the retention policies\n#log.retention.check.interval.ms=300000\n############################# Zookeeper #############################\n# Zookeeper connection string (see zookeeper docs for details).\n# This is a comma separated host:port pairs, each corresponding to a zk\n# server. e.g. "127.0.0.1:3000,127.0.0.1:3001,127.0.0.1:3002".\n# You can also append an optional chroot string to the urls to specify the\n# root directory for all kafka znodes.\nzookeeper.connect=zk-${instanceId}-0.zk-svc-${instanceId}.${namespace}.svc.cluster.local:2181,zk-${instanceId}-1.zk-svc-${instanceId}.${namespace}.svc.cluster.local:2181,zk-${instanceId}-2.zk-svc-${instanceId}.${namespace}.svc.cluster.local:2181\n# Timeout in ms for connecting to zookeeper\n#zookeeper.connection.timeout.ms=6000\n############################# Group Coordinator Settings #############################\n# The following configuration specifies the time, in milliseconds, that the GroupCoordinator will delay the initial consumer rebalance.\n# The rebalance will be further delayed by the value of group.initial.rebalance.delay.ms as new members join the group, up to a maximum of max.poll.interval.ms.\n# The default value for this is 3 seconds.\n# We override this to 0 here as it makes for a better out-of-the-box experience for development and testing.\n# However, in production environments the default value of 3 seconds is more suitable as this will help to avoid unnecessary, and potentially expensive, rebalances during application startup.\n#group.initial.rebalance.delay.ms=0`,
                'log4j.properties':
                  "# Unspecified loggers and loggers with additivity=true output to server.log and stdout\n# Note that INFO only applies to unspecified loggers, the log level of the child logger is used otherwise\nlog4j.rootLogger=INFO, stdout\nlog4j.appender.stdout=org.apache.log4j.ConsoleAppender\nlog4j.appender.stdout.layout=org.apache.log4j.PatternLayout\nlog4j.appender.stdout.layout.ConversionPattern=[%d] %p %m (%c)%n\nlog4j.appender.kafkaAppender=org.apache.log4j.DailyRollingFileAppender\nlog4j.appender.kafkaAppender.DatePattern='.'yyyy-MM-dd-HH\nlog4j.appender.kafkaAppender.File=${kafka.logs.dir}/server.log\nlog4j.appender.kafkaAppender.layout=org.apache.log4j.PatternLayout\nlog4j.appender.kafkaAppender.layout.ConversionPattern=[%d] %p %m (%c)%n\nlog4j.appender.stateChangeAppender=org.apache.log4j.DailyRollingFileAppender\nlog4j.appender.stateChangeAppender.DatePattern='.'yyyy-MM-dd-HH\nlog4j.appender.stateChangeAppender.File=${kafka.logs.dir}/state-change.log\nlog4j.appender.stateChangeAppender.layout=org.apache.log4j.PatternLayout\nlog4j.appender.stateChangeAppender.layout.ConversionPattern=[%d] %p %m (%c)%n\nlog4j.appender.requestAppender=org.apache.log4j.DailyRollingFileAppender\nlog4j.appender.requestAppender.DatePattern='.'yyyy-MM-dd-HH\nlog4j.appender.requestAppender.File=${kafka.logs.dir}/kafka-request.log\nlog4j.appender.requestAppender.layout=org.apache.log4j.PatternLayout\nlog4j.appender.requestAppender.layout.ConversionPattern=[%d] %p %m (%c)%n\nlog4j.appender.cleanerAppender=org.apache.log4j.DailyRollingFileAppender\nlog4j.appender.cleanerAppender.DatePattern='.'yyyy-MM-dd-HH\nlog4j.appender.cleanerAppender.File=${kafka.logs.dir}/log-cleaner.log\nlog4j.appender.cleanerAppender.layout=org.apache.log4j.PatternLayout\nlog4j.appender.cleanerAppender.layout.ConversionPattern=[%d] %p %m (%c)%n\nlog4j.appender.controllerAppender=org.apache.log4j.DailyRollingFileAppender\nlog4j.appender.controllerAppender.DatePattern='.'yyyy-MM-dd-HH\nlog4j.appender.controllerAppender.File=${kafka.logs.dir}/controller.log\nlog4j.appender.controllerAppender.layout=org.apache.log4j.PatternLayout\nlog4j.appender.controllerAppender.layout.ConversionPattern=[%d] %p %m (%c)%n\nlog4j.appender.authorizerAppender=org.apache.log4j.DailyRollingFileAppender\nlog4j.appender.authorizerAppender.DatePattern='.'yyyy-MM-dd-HH\nlog4j.appender.authorizerAppender.File=${kafka.logs.dir}/kafka-authorizer.log\nlog4j.appender.authorizerAppender.layout=org.apache.log4j.PatternLayout\nlog4j.appender.authorizerAppender.layout.ConversionPattern=[%d] %p %m (%c)%n\n# Change the two lines below to adjust ZK client logging\nlog4j.logger.org.I0Itec.zkclient.ZkClient=INFO\nlog4j.logger.org.apache.zookeeper=INFO\n# Change the two lines below to adjust the general broker logging level (output to server.log and stdout)\nlog4j.logger.kafka=INFO\nlog4j.logger.org.apache.kafka=INFO\n# Change to DEBUG or TRACE to enable request logging\nlog4j.logger.kafka.request.logger=WARN, requestAppender\nlog4j.additivity.kafka.request.logger=false\n# Uncomment the lines below and change log4j.logger.kafka.network.RequestChannel$ to TRACE for additional output\n# related to the handling of requests\n#log4j.logger.kafka.network.Processor=TRACE, requestAppender\n#log4j.logger.kafka.server.KafkaApis=TRACE, requestAppender\n#log4j.additivity.kafka.server.KafkaApis=false\nlog4j.logger.kafka.network.RequestChannel$=WARN, requestAppender\nlog4j.additivity.kafka.network.RequestChannel$=false\nlog4j.logger.kafka.controller=TRACE, controllerAppender\nlog4j.additivity.kafka.controller=false\nlog4j.logger.kafka.log.LogCleaner=INFO, cleanerAppender\nlog4j.additivity.kafka.log.LogCleaner=false\nlog4j.logger.state.change.logger=TRACE, stateChangeAppender\nlog4j.additivity.state.change.logger=false\n# Change to DEBUG to enable audit log for the authorizer\nlog4j.logger.kafka.authorizer.logger=WARN, authorizerAppender\nlog4j.additivity.kafka.authorizer.logger=false",
              },
            }),
          },
          (err, response) => {
            if (err) {
              reject(err);
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
          `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/services`,
          {
            content: JSON.stringify({
              apiVersion: 'v1',
              kind: 'Service',
              metadata: {
                name: `kafka-svc-${instanceId}`,
                labels: {
                  app: `kafka-svc-${instanceId}`,
                  service: 'privatehive',
                },
              },
              spec: {
                ports: [
                  {
                    port: 9092,
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
          `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1/namespaces/${namespace}/statefulsets`,
          {
            /*content: `
              apiVersion: apps/v1
              kind: StatefulSet
              metadata:
                name: kafka-${instanceId}
              spec:
                serviceName: kafka-svc-${instanceId}
                replicas: 4
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
                        --override zookeeper.connect=zk-${instanceId}-0.zk-svc-${instanceId}.${namespace}.svc.cluster.local:2181,zk-${instanceId}-1.zk-svc-${instanceId}.${namespace}.svc.cluster.local:2181,zk-${instanceId}-2.zk-svc-${instanceId}.${namespace}.svc.cluster.local:2181 \
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
            `,*/
            content: JSON.stringify({
              apiVersion: 'apps/v1',
              kind: 'StatefulSet',
              metadata: {
                name: `kafka-${instanceId}`,
              },
              spec: {
                selector: {
                  matchLabels: {
                    app: `kafka-${instanceId}`,
                  },
                },
                serviceName: `kafka-svc-${instanceId}`,
                replicas: 3,
                updateStrategy: {
                  type: 'OnDelete',
                },
                template: {
                  metadata: {
                    labels: {
                      app: `kafka-${instanceId}`,
                    },
                    annotations: null,
                  },
                  spec: {
                    terminationGracePeriodSeconds: 30,
                    serviceAccountName: 'dev-webapp',
                    initContainers: [
                      {
                        name: 'init-config',
                        image: 'solsson/kafka-initutils@sha256:18bf01c2c756b550103a99b3c14f741acccea106072cd37155c6d24be4edd6e2',
                        env: [
                          {
                            name: 'NODE_NAME',
                            valueFrom: {
                              fieldRef: {
                                fieldPath: 'spec.nodeName',
                              },
                            },
                          },
                          {
                            name: 'POD_NAME',
                            valueFrom: {
                              fieldRef: {
                                fieldPath: 'metadata.name',
                              },
                            },
                          },
                          {
                            name: 'POD_NAMESPACE',
                            valueFrom: {
                              fieldRef: {
                                fieldPath: 'metadata.namespace',
                              },
                            },
                          },
                        ],
                        command: ['/bin/bash', '/etc/kafka-configmap/init.sh'],
                        volumeMounts: [
                          {
                            name: 'configmap',
                            mountPath: '/etc/kafka-configmap',
                          },
                          {
                            name: 'config',
                            mountPath: '/etc/kafka',
                          },
                        ],
                      },
                    ],
                    containers: [
                      {
                        name: 'broker',
                        image: 'solsson/kafka:1.0.1@sha256:1a4689d49d6274ac59b9b740f51b0408e1c90a9b66d16ad114ee9f7193bab111',
                        env: [
                          {
                            name: 'KAFKA_LOG4J_OPTS',
                            value: '-Dlog4j.configuration=file:/etc/kafka/log4j.properties',
                          },
                          {
                            name: 'JMX_PORT',
                            value: '5555',
                          },
                          {
                            name: 'KAFKA_LOG_RETENTION_MS',
                            value: '-1',
                          },
                          {
                            name: 'KAFKA_MESSAGE_MAX_BYTES',
                            value: '103809024',
                          },
                          {
                            name: 'KAFKA_REPLICA_FETCH_MAX_BYTES',
                            value: '103809024',
                          },
                          {
                            name: 'KAFKA_BROKER_ID',
                            value: '0',
                          },
                          {
                            name: 'KAFKA_ZOOKEEPER_CONNECT',
                            value: `zk-${instanceId}-0.zk-svc-${instanceId}.${namespace}.svc.cluster.local:2181,zk-${instanceId}-1.zk-svc-${instanceId}.${namespace}.svc.cluster.local:2181,zk-${instanceId}-2.zk-svc-${instanceId}.${namespace}.svc.cluster.local:2181`,
                          },
                          {
                            name: 'KAFKA_UNCLEAN_LEADER_ELECTION_ENABLE',
                            value: 'false',
                          },
                          {
                            name: 'KAFKA_DEFAULT_REPLICATION_FACTOR',
                            value: '3',
                          },
                          {
                            name: 'KAFKA_MIN_INSYNC_REPLICAS',
                            value: '2',
                          },
                          {
                            name: 'KAFKA_LISTENERS',
                            value: 'INSIDE://0.0.0.0:9092,OUTSIDE://0.0.0.0:9094',
                          },
                          {
                            name: 'KAFKA_LISTENER_SECURITY_PROTOCOL_MAP',
                            value: 'INSIDE:PLAINTEXT,OUTSIDE:PLAINTEXT',
                          },
                          {
                            name: 'KAFKA_INTER_BROKER_LISTENER_NAME',
                            value: 'INSIDE',
                          },
                        ],
                        ports: [
                          {
                            name: 'inside',
                            containerPort: 9092,
                          },
                          {
                            name: 'outside',
                            containerPort: 9094,
                          },
                          {
                            name: 'jmx',
                            containerPort: 5555,
                          },
                        ],
                        command: ['./bin/kafka-server-start.sh', '/etc/kafka/server.properties'],
                        resources: {
                          requests: {
                            cpu: '100m',
                            memory: '512Mi',
                          },
                        },
                        readinessProbe: {
                          tcpSocket: {
                            port: 9092,
                          },
                          timeoutSeconds: 1,
                        },
                        volumeMounts: [
                          {
                            name: 'config',
                            mountPath: '/etc/kafka',
                          },
                          {
                            name: 'data',
                            mountPath: '/var/lib/kafka/data',
                          },
                        ],
                      },
                    ],
                    volumes: [
                      {
                        name: 'configmap',
                        configMap: {
                          name: `broker-config-${instanceId}`,
                        },
                      },
                      {
                        name: 'config',
                        emptyDir: {},
                      },
                    ],
                  },
                },
                volumeClaimTemplates: [
                  {
                    metadata: {
                      name: 'data',
                    },
                    spec: {
                      accessModes: ['ReadWriteOnce'],
                      storageClassName: 'gp2-storage-class',
                      resources: {
                        requests: {
                          storage: '200Gi',
                        },
                      },
                    },
                  },
                ],
              },
            }),
            headers: {
              'Content-Type': 'application/yaml',
            },
          },
          (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    }

    await createConfigMap();
    await createService();
    await createStatefulSet();

    return Promise.resolve();
  } catch (e) {
    return Promise.reject(e);
  }
};

Creators.createOrdererDeployment = async function createDeployment({
  locationCode,
  namespace,
  instanceId,
  workerNodeIP,
  peerOrgName,
  peerAdminCert,
  peerCACert,
  peerWorkerNodeIP,
  anchorCommPort,
  ordererNodePort,
}) {
  return new Promise((resolve, reject) => {
    HTTP.call(
      'POST',
      `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta1/namespaces/${namespace}/deployments`,
      {
        content: JSON.stringify({
          apiVersion: 'apps/v1beta1',
          kind: 'Deployment',
          metadata: {
            name: `${instanceId}-privatehive`,
            labels: {
              app: `${instanceId}-privatehive`,
              service: 'privatehive',
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
                initContainers: [
                  {
                    name: 'ledgerpathcreator',
                    image: 'alpine',
                    volumeMounts: [
                      {
                        name: 'privatehive-dir',
                        mountPath: '/etc/hyperledger/privatehive',
                      },
                    ],
                    command: ['/bin/sh'],
                    args: ['-c', 'mkdir -p /etc/hyperledger/privatehive/ledgerData'],
                  },
                ],
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
                      {
                        name: 'NAMESPACE',
                        value: namespace,
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
                        value: namespace,
                      },
                      {
                        name: 'ORDERER_FILELEDGER_LOCATION',
                        value: '/etc/hyperledger/privatehive/ledgerData',
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
          console.log('Error creating deployment', err);
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

Creators.createBasicAuth = async ({ locationCode, namespace, instanceId, password }) => {
  return new Promise((resolve, reject) => {
    HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/secrets/` + 'basic-auth-ph-' + instanceId, function(error, response) {
      if (!password) {
        return resolve();
      }
      let encryptedPassword = md5(password);
      let auth = Buffer.from(Buffer.from(instanceId + ':' + encryptedPassword).toString('utf-8')).toString('base64');
      HTTP.call(
        'POST',
        `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${namespace}/secrets`,
        {
          content: JSON.stringify({
            apiVersion: 'v1',
            data: {
              auth: auth,
            },
            kind: 'Secret',
            metadata: {
              name: 'basic-auth-ph-' + instanceId,
            },
            type: 'Opaque',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
        (err, res) => {
          if (err) {
            return reject(err);
          }
          resolve();
        }
      );
    });
  });
};

Creators.createAPIIngress = async ({ locationCode, namespace, instanceId, password }) => {
  if (!RemoteConfig.Ingress.Annotations) {
    RemoteConfig.Ingress.Annotations = {};
  }
  let annotations = {
    ...{
      'nginx.ingress.kubernetes.io/rewrite-target': '/',
      'nginx.ingress.kubernetes.io/enable-cors': 'true',
      'nginx.ingress.kubernetes.io/cors-credentials': 'true',
      'kubernetes.io/ingress.class': 'nginx',
      'nginx.ingress.kubernetes.io/configuration-snippet': `if ($request_method = 'OPTIONS') {\n    add_header 'Access-Control-Max-Age' 1728000;\n    add_header 'Content-Type' 'text/plain charset=UTF-8';\n    add_header 'Content-Length' 0;\n    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE';\n    return 204;\n}`,
    },
    ...RemoteConfig.Ingress.Annotations,
  };

  if (password) {
    annotations = {
      ...annotations,
      'nginx.ingress.kubernetes.io/auth-type': 'basic',
      'nginx.ingress.kubernetes.io/auth-secret': 'basic-auth-ph-' + instanceId,
      'nginx.ingress.kubernetes.io/auth-realm': 'Authentication Required',
    };
  }

  const tlsConfig = {
    hosts: [Config.workerNodeDomainName(locationCode)],
  };

  if (RemoteConfig.Ingress.tlsSecret) {
    tlsConfig.secretName = RemoteConfig.Ingress.tlsSecret;
  }
  console.log('Creating ingress', instanceId);
  return new Promise((resolve, reject) => {
    HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${namespace}/ingresses/` + `${instanceId}-privatehive`, async function(
      error,
      response
    ) {
      if (password) {
        await Creators.createBasicAuth({ locationCode, namespace, instanceId, password });
      }
      HTTP.call(
        'POST',
        `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${namespace}/ingresses`,
        {
          content: JSON.stringify({
            apiVersion: 'extensions/v1beta1',
            kind: 'Ingress',
            metadata: {
              name: `${instanceId}-privatehive`,
              labels: {
                service: 'privatehive',
                app: `${instanceId}-privatehive`,
              },
              annotations,
            },
            spec: {
              tls: [tlsConfig],
              rules: [
                {
                  host: Config.workerNodeDomainName(locationCode),
                  http: {
                    paths: [
                      {
                        path: `/api/privatehive/${instanceId}`,
                        backend: {
                          serviceName: `${instanceId}-privatehive`,
                          servicePort: 3000,
                        },
                      },
                    ],
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
            console.log('Error creating ingress', err);
            return reject(err);
          }
          resolve();
        }
      );
    });
  });
};

Creators.deleteIngress = async ({ locationCode, namespace, name }) => {
  return new Promise((resolve, reject) => {
    HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${namespace}/ingresses/${name}`, (err, response) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

export default Creators;
