require('../imports/startup/server/');
require('../imports/api/emails/email-validator');
require('../imports/api/emails/forgot-password');
require('../imports/api/locations');
require('../imports/modules/migrations/server');
require('../imports/api');
const debug = require('debug')('server:main');
import { Meteor } from 'meteor/meteor';
import UserFunctions from '../imports/api/server-functions/user-functions';
import { Networks } from '../imports/collections/networks/networks.js';
import NetworkFunctions from '../imports/api/network/networks';
import Vouchers from '../imports/collections/vouchers/voucher';
import UserCards from '../imports/collections/payments/user-cards';
import Billing from '../imports/api/billing';
import NetworkConfiguration from '../imports/collections/network-configuration/network-configuration';
import Verifier from '../imports/api/emails/email-validator';
import Config from '../imports/modules/config/server';
import Bull from '../imports/modules/schedulers/bull';

var Future = Npm.require('fibers/future');
import Web3 from 'web3';
var jsonminify = require('jsonminify');
import helpers from '../imports/modules/helpers';
import smartContracts from '../imports/modules/smart-contracts';
import moment from 'moment';
import fs from 'fs';
import agenda from '../imports/modules/schedulers/agenda';
import Webhook from '../imports/api/communication/webhook';
var md5 = require('apache-md5');
var base64 = require('base-64');
var utf8 = require('utf8');

var geoip = require('../node_modules/geoip-lite/lib/geoip');

Accounts.validateLoginAttempt(function(options) {
  if (!options.allowed) {
    return false;
  }

  if (!['production'].includes(process.env.NODE_ENV)) {
    if (!options.user.emails[0].address.includes('@blockcluster.io')) {
      throw new Meteor.Error('Not Allowed', 'Only blockcluster ids are allowed on any env except production');
    }
  }

  if (options.methodName == 'createUser') {
    throw new Meteor.Error('unverified-account-created');
  }

  if (options.user.emails[0].verified === true) {
    return true;
  } else {
    throw new Meteor.Error('email-not-verified', 'Your email is not verified. Kindly check your mail.');
  }
});

Accounts.onCreateUser(function(options, user) {
  user.firstLogin = false;
  user.profile = options.profile || {};

  // Assigns first and last names to the newly created user object
  user.profile.firstName = options.profile.firstName;
  user.profile.lastName = options.profile.lastName;

  if (!(!options.profile.firstName || options.profile.firstName === 'null' || options.profile.firstName === 'undefined')) {
    Verifier.sendEmailVerification(user);
  }

  return user;
});

function getNodeConfig(networkConfig, userId) {
  let nodeConfig = {};
  let finalNetworkConfig = undefined;
  const { voucher, config, diskSpace } = networkConfig;
  if (voucher) {
    const _voucher = Vouchers.find({
      _id: voucher._id,
    }).fetch()[0];

    if (_voucher) {
      nodeConfig.voucherId = _voucher._id;
      nodeConfig.voucher = _voucher;
      finalNetworkConfig = _voucher.networkConfig;
      if (_voucher.isDiskChangeable) {
        finalNetworkConfig.disk = diskSpace || _voucher.diskSpace;
      }
    }
  }

  if (!finalNetworkConfig && config) {
    const _config = NetworkConfiguration.find({
      _id: config._id,
    }).fetch()[0];
    if (_config) {
      nodeConfig.configId = _config._id;
      nodeConfig.networkConfig = _config;
      finalNetworkConfig = _config;
      if (_config.isDiskChangeable) {
        finalNetworkConfig.disk = diskSpace || _config.disk;
      }
    }
  }

  if (!finalNetworkConfig) {
    return nodeConfig;
  }

  debug('Returning node config', networkConfig, userId);

  nodeConfig = {
    ...nodeConfig,
    cpu: finalNetworkConfig.cpu * 1000,
    ram: finalNetworkConfig.ram,
    disk: finalNetworkConfig.disk,
  };

  return nodeConfig;
}

function getContainerResourceLimits({ cpu, ram, isJoining }) {
  const CpuPercentage = {
    mongo: 0.15,
    impulse: isJoining ? 0 : 0.2,
    dynamo: isJoining ? 0.85 : 0.65,
  };

  const RamPercentage = {
    mongo: 0.05,
    impulse: isJoining ? 0 : 0.15,
    dynamo: isJoining ? 0.95 : 0.8,
  };

  const config = {
    mongo: {
      cpu: Math.floor(cpu * CpuPercentage.mongo),
      ram: Math.floor(ram * RamPercentage.mongo * 1000) / 1000,
    },
    dynamo: {
      cpu: Math.floor(cpu * CpuPercentage.dynamo),
      ram: Math.floor(ram * RamPercentage.dynamo * 1000) / 1000,
    },
    impulse: {
      cpu: Math.floor(cpu * CpuPercentage.impulse),
      ram: Math.floor(ram * RamPercentage.impulse * 1000) / 1000,
    },
  };

  debug('Container limits', config);

  return config;
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled rejection', reason);
  RavenLogger.log(reason);
});

process.on('uncaughtException', (reason, p) => {
  console.log('Unhandled exception', reason);
  RavenLogger.log(reason);
});

Meteor.methods({
  createNetwork: async function({ networkName, locationCode, networkConfig, userId }) {
    debug('CreateNetwork | Arguments', networkName, locationCode, networkConfig, userId);
    userId = userId || Meteor.userId();
    var myFuture = new Future();
    const nodeConfig = getNodeConfig(networkConfig);

    const isPaymentMethodVerified = await Billing.isPaymentMethodVerified(userId);
    const need_VerifiedPaymnt = nodeConfig.voucher && !nodeConfig.voucher.availability.card_vfctn_needed ? nodeConfig.voucher.availability.card_vfctn_needed : true;
    if (need_VerifiedPaymnt) {
      if (!isPaymentMethodVerified) {
        throw new Meteor.Error('unauthorized', 'Credit card not verified');
      }
    }

    var instanceId = helpers.instanceIDGenerate();

    if (!locationCode) {
      throw new Meteor.Error('bad-request', 'Location code is required');
    }

    function deleteNetwork(id) {
      debug('CreateNetwork | Deleting network', id);
      Networks.update(
        {
          _id: id,
        },
        {
          $set: {
            active: false,
            deletedAt: new Date().getTime(),
          },
        }
      );
      NetworkFunctions.cleanNetworkDependencies(id);
      HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/deployments/` + instanceId, function(error, response) {});
      HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + instanceId, function(error, response) {});
      HTTP.call(
        'GET',
        `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets?labelSelector=app%3D` +
          encodeURIComponent('dynamo-node-' + instanceId),
        function(error, response) {
          if (!error) {
            if (JSON.parse(response.content).items.length > 0) {
              HTTP.call(
                'DELETE',
                `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets/` + JSON.parse(response.content).items[0].metadata.name,
                function(error, response) {
                  HTTP.call(
                    'GET',
                    `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3D` + encodeURIComponent('dynamo-node-' + instanceId),
                    function(error, response) {
                      if (!error) {
                        if (JSON.parse(response.content).items.length > 0) {
                          HTTP.call(
                            'DELETE',
                            `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods/` + JSON.parse(response.content).items[0].metadata.name,
                            function(error, response) {
                              HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets/` + 'basic-auth-' + instanceId, function(
                                error,
                                response
                              ) {});
                              HTTP.call(
                                'DELETE',
                                `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses/` + 'ingress-' + instanceId,
                                function(error, response) {}
                              );
                              HTTP.call(
                                'DELETE',
                                `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/persistentvolumeclaims/` + `${instanceId}-pvc`,
                                function(error, response) {}
                              );
                              myFuture.throw('Error creating network');
                            }
                          );
                        }
                      }
                    }
                  );
                }
              );
            }
          }
        }
      );
    }

    if (!nodeConfig.cpu) {
      RavenLogger.log('CreateNetwork : Invalid network configuration', { nodeConfig, networkConfig });
      throw new Meteor.Error('Invalid Network Configuration');
    }

    const resourceConfig = getContainerResourceLimits({ cpu: nodeConfig.cpu, ram: nodeConfig.ram });

    const networkProps = {
      instanceId: instanceId,
      name: networkName,
      type: 'new',
      peerType: 'authority',
      workerNodeIP: Config.workerNodeIP(locationCode),
      user: userId ? userId : this.userId,
      createdOn: Date.now(),
      totalENodes: [],
      locationCode: locationCode,
      voucherId: nodeConfig.voucherId,
      networkConfigId: nodeConfig.configId,
      metadata: {
        voucher: nodeConfig.voucher,
        networkConfig: nodeConfig.networkConfig,
      },
      networkConfig: {
        cpu: nodeConfig.cpu,
        ram: nodeConfig.ram,
        disk: nodeConfig.disk,
      },
      // hostedPageId: hostedPage._id
    };

    debug('CreateNetwork | Network insert ', networkProps);

    Networks.insert(networkProps, (error, id) => {
      if (error) {
        console.log(error);
        myFuture.throw('An unknown error occured');
      } else {
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
                    storage: `${nodeConfig.disk}Gi`,
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
              console.log(err);
              throw new Meteor.Error('Error allocating storage');
            }
            HTTP.call(
              'POST',
              `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta1/namespaces/${Config.namespace}/deployments`,
              {
                content: JSON.stringify({
                  apiVersion: 'apps/v1beta1',
                  kind: 'Deployment',
                  metadata: {
                    name: instanceId,
                  },
                  spec: {
                    replicas: 1,
                    revisionHistoryLimit: 10,
                    template: {
                      metadata: {
                        labels: {
                          app: 'dynamo-node-' + instanceId,
                          appType: 'dynamo',
                        },
                      },
                      spec: {
                        affinity: {
                          nodeAffinity: {
                            preferredDuringSchedulingIgnoredDuringExecution: [
                              {
                                weight: 1,
                                preference: {
                                  matchExpressions: [
                                    {
                                      key: 'optimizedFor',
                                      operator: 'In',
                                      values: ['memory'],
                                    },
                                  ],
                                },
                              },
                            ],
                          },
                        },
                        containers: [
                          {
                            name: 'mongo',
                            image: `mongo:3.4.18`,
                            imagePullPolicy: 'IfNotPresent',
                            ports: [
                              {
                                containerPort: 27017,
                              },
                            ],
                            resources: {
                              requests: {
                                cpu: `${resourceConfig.mongo.cpu}m`,
                                memory: `${resourceConfig.mongo.ram}Gi`,
                              },
                              limits: {
                                cpu: `${resourceConfig.mongo.cpu + 150}m`,
                                memory: `${resourceConfig.mongo.ram + 0.2}Gi`,
                              },
                            },
                            volumeMounts: [
                              {
                                name: 'dynamo-dir',
                                mountPath: '/data/db',
                              },
                            ],
                          },
                          {
                            name: 'dynamo',
                            image: Config.getImageRepository('dynamo'),
                            command: ['/bin/bash', '-i', '-c', './setup.sh'],
                            env: [
                              {
                                name: 'instanceId',
                                value: instanceId,
                              },
                              {
                                name: 'MONGO_URL',
                                value: `${process.env.MONGO_URL}`,
                              },
                              {
                                name: 'WORKER_NODE_IP',
                                value: `${Config.workerNodeIP(locationCode)}`,
                              },
                            ],
                            imagePullPolicy: 'Always',
                            ports: [
                              {
                                containerPort: 8545,
                              },
                              {
                                containerPort: 23000,
                              },
                              {
                                containerPort: 9001,
                              },
                              {
                                containerPort: 6382,
                              },
                            ],
                            volumeMounts: [
                              {
                                name: 'dynamo-dir',
                                mountPath: '/dynamo/bcData',
                              },
                            ],
                            resources: {
                              requests: {
                                cpu: `${resourceConfig.dynamo.cpu}m`,
                                memory: `${resourceConfig.dynamo.ram}Gi`,
                              },
                              limits: {
                                cpu: `${resourceConfig.dynamo.cpu}m`,
                                memory: `${resourceConfig.dynamo.ram + 0.2}Gi`,
                              },
                            },
                            lifecycle: {
                              postStart: {
                                exec: {
                                  command: ['/bin/bash', '-c', 'node ./apis/postStart.js'],
                                },
                              },
                              preStop: {
                                exec: {
                                  command: ['/bin/bash', '-c', 'node ./apis/preStop.js'],
                                },
                              },
                            },
                          },
                          {
                            name: 'impulse',
                            image: Config.getImageRepository('impulse'),
                            env: [
                              {
                                name: 'instanceId',
                                value: instanceId,
                              },
                              {
                                name: 'MONGO_URL',
                                value: `${process.env.MONGO_URL}`,
                              },
                              {
                                name: 'WORKER_NODE_IP',
                                value: `${Config.workerNodeIP(locationCode)}`,
                              },
                            ],
                            resources: {
                              requests: {
                                cpu: `${resourceConfig.impulse.cpu}m`,
                                memory: `${resourceConfig.impulse.ram}Gi`,
                              },
                              limits: {
                                cpu: `${resourceConfig.impulse.cpu}m`,
                                memory: `${resourceConfig.impulse.ram + 0.2}Gi`,
                              },
                            },
                            lifecycle: {
                              postStart: {
                                exec: {
                                  command: ['/bin/bash', '-c', 'node /impulse/postStart.js'],
                                },
                              },
                              preStop: {
                                exec: {
                                  command: ['/bin/bash', '-c', 'node /impulse/preStop.js'],
                                },
                              },
                            },
                            imagePullPolicy: 'Always',
                            ports: [
                              {
                                containerPort: 7558,
                              },
                            ],
                          },
                        ],
                        volumes: [
                          {
                            name: 'dynamo-dir',
                            persistentVolumeClaim: {
                              claimName: `${instanceId}-pvc`,
                            },
                          },
                        ],
                        imagePullSecrets: [
                          {
                            name: 'regsecret',
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
              function(error, response) {
                if (error) {
                  console.log(error);
                  deleteNetwork(id);
                } else {
                  HTTP.call(
                    'POST',
                    `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services`,
                    {
                      content: JSON.stringify({
                        kind: 'Service',
                        apiVersion: 'v1',
                        metadata: {
                          name: instanceId,
                        },
                        spec: {
                          ports: [
                            {
                              name: 'rpc',
                              port: 8545,
                            },
                            {
                              name: 'eth',
                              port: 23000,
                            },
                            {
                              name: 'apis',
                              port: 6382,
                            },
                            {
                              name: 'impulse',
                              port: 7558,
                            },
                          ],
                          selector: {
                            app: 'dynamo-node-' + instanceId,
                          },
                          type: 'NodePort',
                        },
                      }),
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    },
                    (error, response) => {
                      if (error) {
                        console.log(error);
                        deleteNetwork(id);
                      } else {
                        HTTP.call('GET', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + instanceId, {}, (error, response) => {
                          if (error) {
                            console.log(error);
                            deleteNetwork(id);
                          } else {
                            let rpcNodePort = response.data.spec.ports[0].nodePort;

                            Networks.update(
                              {
                                _id: id,
                              },
                              {
                                $set: {
                                  rpcNodePort: response.data.spec.ports[0].nodePort,
                                  ethNodePort: response.data.spec.ports[1].nodePort,
                                  apisPort: response.data.spec.ports[2].nodePort,
                                  impulsePort: response.data.spec.ports[3].nodePort,
                                  clusterIP: response.data.spec.clusterIP,
                                  realRPCNodePort: 8545,
                                  realEthNodePort: 23000,
                                  realAPIsPort: 6382,
                                  realImpulsePort: 7558,
                                  impulseURL: 'http://' + Config.workerNodeIP(locationCode) + ':' + response.data.spec.ports[3].nodePort,
                                },
                              }
                            );

                            HTTP.call(
                              'POST',
                              `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses`,
                              {
                                content: JSON.stringify({
                                  apiVersion: 'extensions/v1beta1',
                                  kind: 'Ingress',
                                  metadata: {
                                    name: 'ingress-' + instanceId,
                                    annotations: {
                                      'nginx.ingress.kubernetes.io/rewrite-target': '/',
                                      //"nginx.ingress.kubernetes.io/auth-type": "basic",
                                      //"nginx.ingress.kubernetes.io/auth-secret": "basic-auth-" + instanceId,
                                      //"nginx.ingress.kubernetes.io/auth-realm": "Authentication Required",
                                      'nginx.ingress.kubernetes.io/enable-cors': 'true',
                                      'nginx.ingress.kubernetes.io/cors-credentials': 'true',
                                      'kubernetes.io/ingress.class': 'nginx',
                                      'nginx.ingress.kubernetes.io/configuration-snippet': `set $cors \"true\";\n# Nginx doesn't support nested If statements. This is where things get slightly nasty.\n# Determine the HTTP request method used\nif ($request_method = 'OPTIONS') {\n    set $cors \"\${cors}options\";\n}\nif ($request_method = 'GET') {\n    set $cors \"\${cors}get\";\n}\nif ($request_method = 'POST') {\n    set $cors \"\${cors}post\";\n}\n\nif ($cors = \"true\") {\n    # Catch all incase there's a request method we're not dealing with properly\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n}\n\nif ($cors = \"trueoptions\") {\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n\n    #\n    # Om nom nom cookies\n    #\n    add_header 'Access-Control-Allow-Credentials' 'true';\n    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';\n\n    #\n    # Custom headers and headers various browsers *should* be OK with but aren't\n    #\n    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';\n\n    #\n    # Tell client that this pre-flight info is valid for 20 days\n    #\n    add_header 'Access-Control-Max-Age' 1728000;\n    add_header 'Content-Type' 'text/plain charset=UTF-8';\n    add_header 'Content-Length' 0;\n    return 204;\n}`,
                                    },
                                  },
                                  spec: {
                                    tls: [
                                      {
                                        hosts: [Config.workerNodeDomainName(locationCode)],
                                        secretName: 'blockcluster-ssl',
                                      },
                                    ],
                                    rules: [
                                      {
                                        host: Config.workerNodeDomainName(locationCode),
                                        http: {
                                          paths: [
                                            {
                                              path: '/api/node/' + instanceId + '/jsonrpc',
                                              backend: {
                                                serviceName: instanceId,
                                                servicePort: 8545,
                                              },
                                            },
                                            {
                                              path: '/api/node/' + instanceId,
                                              backend: {
                                                serviceName: instanceId,
                                                servicePort: 6382,
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
                              error => {
                                if (error) {
                                  console.log(error);
                                  deleteNetwork(id);
                                } else {
                                  Networks.update(
                                    {
                                      _id: id,
                                    },
                                    {
                                      $set: {
                                        'api-password': '',
                                      },
                                    }
                                  );

                                  if (nodeConfig.voucherId) {
                                    Vouchers.update(
                                      { _id: nodeConfig.voucherId },
                                      {
                                        $push: {
                                          voucher_claim_status: {
                                            claimedBy: userId,
                                            claimedOn: new Date(),
                                            claimed: true,
                                          },
                                        },
                                      }
                                    );
                                  }

                                  Bull.addVolumeJob(
                                    'fix-volume',
                                    {
                                      locationCode,
                                      instanceId,
                                    },
                                    {
                                      delay: 5 * 60 * 1000,
                                    }
                                  );

                                  Webhook.queue({
                                    payload: Webhook.generatePayload({ event: 'create-network', networkId: instanceId, userId }),
                                    userId,
                                  });

                                  myFuture.return(instanceId);
                                }
                              }
                            );
                          }
                        });
                      }
                    }
                  );
                }
              }
            );
          }
        );
      }
      //mark the voucher as claimed
      let userCard = UserCards.find({ userId: Meteor.userId(), active: true }, { fields: { _id: 1 } }).fetch();
      //check wheather the user has verified cards or not. and also for active payment methods.

      if (!userCard || !userCard.length || !userCard[0].cards || !userCard[0].cards.length) {
        agenda.schedule(
          moment()
            .add(3, 'days')
            .toDate(),
          'warning email step 1',
          {
            network_id: id,
            userId: Meteor.userId(),
          }
        );
      }
    });

    return myFuture.wait();
  },
  deleteNetwork: async function(id, userId) {
    if (!userId) {
      userId = Meteor.userId();
    }
    try {
      ElasticLogger.log(`DeleteNetwork`, { id: id, userId });
    } catch (err) {
      RavenLogger.log(err);
    }

    var network = Networks.find({
      instanceId: id,
      user: userId,
      deletedAt: null,
    }).fetch()[0];

    if (!network) {
      throw new Meteor.Error('bad-request', 'Invalid instance id');
    }

    Networks.update(
      {
        instanceId: id,
      },
      {
        $set: {
          active: false,
          deletedAt: new Date().getTime(),
        },
      }
    );

    NetworkFunctions.cleanNetworkDependencies(id);

    const locationCode = network.locationCode;

    Webhook.queue({
      userId,
      payload: Webhook.generatePayload({ event: 'delete-network', networkId: id, userId }),
    });

    try {
      Bull.addJob('delete-network', {
        instanceId: network.instanceId,
        locationCode,
      });
    } catch (err) {
      console.log('Kube delete error ', err);
    }

    return id;
  },
  joinNetwork: async function(
    networkName,
    nodeType,
    genesisFileContent,
    totalENodes,
    impulseURL,
    assetsContractAddress,
    atomicSwapContractAddress,
    streamsContractAddress,
    impulseContractAddress,
    locationCode,
    networkConfig,
    userId
  ) {
    const isPaymentMethodVerified = await Billing.isPaymentMethodVerified(userId);
    const nodeConfig = getNodeConfig(networkConfig);
    const need_VerifiedPaymnt = nodeConfig.voucher && !nodeConfig.voucher.availability.card_vfctn_needed ? nodeConfig.voucher.availability.card_vfctn_needed : true;
    if (need_VerifiedPaymnt) {
      if (!isPaymentMethodVerified) {
        throw new Meteor.Error('unauthorized', 'Credit card not verified');
      }
    }

    debug('joinNetwork | Arguments', arguments);
    var myFuture = new Future();
    var instanceId = helpers.instanceIDGenerate();

    locationCode = locationCode || 'us-west-2';

    function deleteNetwork(id) {
      Networks.update(
        {
          _id: id,
        },
        {
          $set: {
            active: false,
            deletedAt: new Date().getTime(),
          },
        }
      );
      NetworkFunctions.cleanNetworkDependencies(id);
      HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/deployments/` + instanceId, function(error, response) {});
      HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + instanceId, function(error, response) {});
      HTTP.call(
        'GET',
        `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets?labelSelector=app%3D` +
          encodeURIComponent('dynamo-node-' + instanceId),
        function(error, response) {
          if (!error) {
            if (JSON.parse(response.content).items.length > 0) {
              HTTP.call(
                'DELETE',
                `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets/` + JSON.parse(response.content).items[0].metadata.name,
                function(error, response) {
                  HTTP.call(
                    'GET',
                    `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3D` + encodeURIComponent('dynamo-node-' + instanceId),
                    function(error, response) {
                      if (!error) {
                        if (JSON.parse(response.content).items.length > 0) {
                          HTTP.call(
                            'DELETE',
                            `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods/` + JSON.parse(response.content).items[0].metadata.name,
                            function(error, response) {
                              HTTP.call(
                                'DELETE',
                                `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/persistentvolumeclaims/` + `${instanceId}-pvc`,
                                function(error, response) {}
                              );
                              HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets/` + 'basic-auth-' + instanceId, function(
                                error,
                                response
                              ) {});
                              HTTP.call(
                                'DELETE',
                                `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses/` + 'ingress-' + instanceId,
                                function(error, response) {}
                              );
                            }
                          );
                        }
                      }
                    }
                  );
                }
              );
            }
          }
        }
      );
    }

    if (!nodeConfig.cpu) {
      RavenLogger.log('JoinNetwork : Invalid network config', { nodeConfig, networkConfig });
      throw new Meteor.Error('Invalid Network Configuration');
    }

    const resourceConfig = getContainerResourceLimits({ cpu: nodeConfig.cpu, ram: nodeConfig.ram, isJoining: true });

    userId = userId || Meteor.userId();
    Networks.insert(
      {
        instanceId: instanceId,
        name: networkName,
        type: 'join',
        peerType: nodeType,
        workerNodeIP: Config.workerNodeIP(locationCode),
        user: userId,
        createdOn: Date.now(),
        totalENodes: totalENodes,
        genesisBlock: genesisFileContent,
        locationCode: locationCode,
        voucherId: nodeConfig.voucherId,
        networkConfigId: nodeConfig.configId,
        metadata: {
          voucher: nodeConfig.voucher,
          networkConfig: nodeConfig.networkConfig,
        },
        networkConfig: { cpu: nodeConfig.cpu, ram: nodeConfig.ram, disk: nodeConfig.disk },
        impulseURL: impulseURL,
      },
      function(error, id) {
        if (error) {
          console.log(error);
          myFuture.throw('An unknown error occured');
        } else {
          totalENodes = JSON.stringify(totalENodes)
            .replace(/\"/g, '\\"')
            .replace(/\"/g, '\\"')
            .replace(/\"/g, '\\"');
          genesisFileContent = jsonminify(genesisFileContent.toString()).replace(/\"/g, '\\"');

          if (nodeType === 'authority') {
            var content = `apiVersion: apps/v1beta1
kind: Deployment
metadata:
  name: ${instanceId}
spec:
  replicas: 1
  revisionHistoryLimit: 10
  template:
    metadata:
      labels:
        app: dynamo-node-${instanceId}
        appType: dynamo
    spec:
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 1
              preference:
                matchExpressions:
                - key: optimizedFor
                  operator: In
                  values:
                  - memory
      containers:
      - name: mongo
        image: mongo:3.4.18
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 27017
        resources:
          requests:
            memory: "${resourceConfig.mongo.ram}Gi"
            cpu: "${resourceConfig.mongo.cpu}m"
          limits:
            memory: "${resourceConfig.mongo.ram + 0.2}Gi"
            cpu: "${resourceConfig.mongo.cpu + 150}m"
        volumeMounts:
        - name: dynamo-dir
          mountPath: /data/db
      - name: dynamo
        image: ${Config.getImageRepository('dynamo')}
        command: [ "/bin/bash", "-i", "-c", "./setup.sh ${totalENodes} '${genesisFileContent}'  mine" ]
        lifecycle:
          postStart:
            exec:
              command: ["/bin/bash", "-c", "node ./apis/postStart.js"]
          preStop:
            exec:
              command: ["/bin/bash", "-c", "node ./apis/preStop.js"]
        imagePullPolicy: Always
        ports:
        - containerPort: 8545
        - containerPort: 23000
        - containerPort: 9001
        - containerPort: 6382
        env:
        - name: MONGO_URL
          value: ${process.env.MONGO_URL}
        - name: WORKER_NODE_IP
          value: ${Config.workerNodeIP(locationCode)}
        - name: instanceId
          value: ${instanceId}
        - name: assetsContractAddress
          value: ${assetsContractAddress}
        - name: atomicSwapContractAddress
          value: ${atomicSwapContractAddress}
        - name: streamsContractAddress
          value: ${streamsContractAddress}
        - name: impulseContractAddress
          value: ${impulseContractAddress}
        - name: IMPULSE_URL
          value: ${impulseURL}
        resources:
          requests:
            memory: "${resourceConfig.dynamo.ram}Gi"
            cpu: "${resourceConfig.dynamo.cpu}m"
          limits:
            memory: "${resourceConfig.dynamo.ram + 0.2}Gi"
            cpu: "${resourceConfig.dynamo.cpu}m"
        volumeMounts:
        - name: dynamo-dir
          mountPath: /dynamo/bcData
      volumes:
        - name: dynamo-dir
          persistentVolumeClaim:
            claimName: ${instanceId}-pvc
      imagePullSecrets:
      - name: regsecret`;
          } else {
            var content = `apiVersion: apps/v1beta1
kind: Deployment
metadata:
  name: ${instanceId}
spec:
  replicas: 1
  revisionHistoryLimit: 10
  template:
    metadata:
      labels:
        app: dynamo-node-${instanceId}
        appType: dynamo
    spec:
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 1
            preference:
              matchExpressions:
              - key: optimizedFor
                operator: In
                values:
                - memory
      containers:
      - name: mongo
        image: mongo:3.4.18
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 27017
        resources:
          requests:
            memory: "${resourceConfig.mongo.ram}Gi"
            cpu: "${resourceConfig.mongo.cpu}m"
          limits:
            memory: "${resourceConfig.mongo.ram + 0.2}Gi"
            cpu: "${resourceConfig.mongo.cpu + 150}m"
        volumeMounts:
        - name: dynamo-dir
          mountPath: /data/db
      - name: dynamo
        image: ${Config.getImageRepository('dynamo')}
        command: [ "/bin/bash", "-i", "-c", "./setup.sh ${totalENodes} '${genesisFileContent}'" ]
        lifecycle:
          postStart:
            exec:
              command: ["/bin/bash", "-c", "node ./apis/postStart.js"]
          preStop:
            exec:
              command: ["/bin/bash", "-c", "node ./apis/preStop.js"]
        imagePullPolicy: Always
        ports:
        - containerPort: 8545
        - containerPort: 23000
        - containerPort: 9001
        - containerPort: 6382
        env:
        - name: MONGO_URL
          value: ${process.env.MONGO_URL}
        - name: WORKER_NODE_IP
          value: ${Config.workerNodeIP(locationCode)}
        - name: instanceId
          value: ${instanceId}
        - name: assetsContractAddress
          value: ${assetsContractAddress}
        - name: atomicSwapContractAddress
          value: ${atomicSwapContractAddress}
        - name: streamsContractAddress
          value: ${streamsContractAddress}
        - name: impulseContractAddress
          value: ${impulseContractAddress}
        - name: IMPULSE_URL
          value: ${impulseURL}
        resources:
          requests:
            memory: "${resourceConfig.dynamo.ram}Gi"
            cpu: "${resourceConfig.dynamo.cpu}m"
          limits:
            memory: "${resourceConfig.dynamo.ram + 0.2}Gi"
            cpu: "${resourceConfig.dynamo.cpu}m"
        volumeMounts:
        - name: dynamo-dir
          mountPath: /dynamo/bcData
      volumes:
        - name: dynamo-dir
          persistentVolumeClaim:
            claimName: ${instanceId}-pvc
      imagePullSecrets:
      - name: regsecret`;
          }
          HTTP.call('POST', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/persistentvolumeclaims`, {
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
                    storage: `${nodeConfig.disk}Gi`,
                  },
                },
                storageClassName: 'gp2-storage-class',
              },
            }),
            headers: {
              'Content-Type': 'application/yaml',
            },
          });

          HTTP.call(
            'POST',
            `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta1/namespaces/${Config.namespace}/deployments`,
            {
              content: content,
              headers: {
                'Content-Type': 'application/yaml',
              },
            },
            function(error, response) {
              if (error) {
                console.log(error);
                deleteNetwork(id);
              } else {
                HTTP.call(
                  'POST',
                  `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services`,
                  {
                    content: JSON.stringify({
                      kind: 'Service',
                      apiVersion: 'v1',
                      metadata: {
                        name: instanceId,
                      },
                      spec: {
                        ports: [
                          {
                            name: 'rpc',
                            port: 8545,
                          },
                          {
                            name: 'eth',
                            port: 23000,
                          },
                          {
                            name: 'apis',
                            port: 6382,
                          },
                        ],
                        selector: {
                          app: 'dynamo-node-' + instanceId,
                        },
                        type: 'NodePort',
                      },
                    }),
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  },
                  function(error, response) {
                    if (error) {
                      console.log(error);
                      deleteNetwork(id);
                    } else {
                      HTTP.call('GET', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + instanceId, {}, function(error, response) {
                        if (error) {
                          console.log(error);
                          deleteNetwork(id);
                        } else {
                          let rpcNodePort = response.data.spec.ports[0].nodePort;
                          Networks.update(
                            {
                              _id: id,
                            },
                            {
                              $set: {
                                rpcNodePort: response.data.spec.ports[0].nodePort,
                                ethNodePort: response.data.spec.ports[1].nodePort,
                                apisPort: response.data.spec.ports[2].nodePort,
                                clusterIP: response.data.spec.clusterIP,
                                realRPCNodePort: 8545,
                                realEthNodePort: 23000,
                                realAPIsPort: 6382,
                              },
                            }
                          );

                          HTTP.call(
                            'POST',
                            `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses`,
                            {
                              content: JSON.stringify({
                                apiVersion: 'extensions/v1beta1',
                                kind: 'Ingress',
                                metadata: {
                                  name: 'ingress-' + instanceId,
                                  annotations: {
                                    'nginx.ingress.kubernetes.io/rewrite-target': '/',
                                    'nginx.ingress.kubernetes.io/enable-cors': 'true',
                                    'nginx.ingress.kubernetes.io/cors-credentials': 'true',
                                    'kubernetes.io/ingress.class': 'nginx',
                                    'nginx.ingress.kubernetes.io/configuration-snippet': `set $cors \"true\";\n# Nginx doesn't support nested If statements. This is where things get slightly nasty.\n# Determine the HTTP request method used\nif ($request_method = 'OPTIONS') {\n    set $cors \"\${cors}options\";\n}\nif ($request_method = 'GET') {\n    set $cors \"\${cors}get\";\n}\nif ($request_method = 'POST') {\n    set $cors \"\${cors}post\";\n}\n\nif ($cors = \"true\") {\n    # Catch all incase there's a request method we're not dealing with properly\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n}\n\nif ($cors = \"trueoptions\") {\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n\n    #\n    # Om nom nom cookies\n    #\n    add_header 'Access-Control-Allow-Credentials' 'true';\n    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';\n\n    #\n    # Custom headers and headers various browsers *should* be OK with but aren't\n    #\n    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';\n\n    #\n    # Tell client that this pre-flight info is valid for 20 days\n    #\n    add_header 'Access-Control-Max-Age' 1728000;\n    add_header 'Content-Type' 'text/plain charset=UTF-8';\n    add_header 'Content-Length' 0;\n    return 204;\n}`,
                                  },
                                },
                                spec: {
                                  tls: [
                                    {
                                      hosts: [Config.workerNodeDomainName(locationCode)],
                                      secretName: 'blockcluster-ssl',
                                    },
                                  ],
                                  rules: [
                                    {
                                      host: Config.workerNodeDomainName(locationCode),
                                      http: {
                                        paths: [
                                          {
                                            path: '/api/node/' + instanceId + '/jsonrpc',
                                            backend: {
                                              serviceName: instanceId,
                                              servicePort: 8545,
                                            },
                                          },
                                          {
                                            path: '/api/node/' + instanceId,
                                            backend: {
                                              serviceName: instanceId,
                                              servicePort: 6382,
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
                            function(error) {
                              if (error) {
                                console.log(error);
                                deleteNetwork(id);
                              } else {
                                Networks.update(
                                  {
                                    _id: id,
                                  },
                                  {
                                    $set: {
                                      'api-password': '',
                                    },
                                  }
                                );

                                Bull.addVolumeJob(
                                  'fix-volume',
                                  {
                                    locationCode,
                                    instanceId,
                                  },
                                  {
                                    delay: 5 * 60 * 1000,
                                  }
                                );

                                Webhook.queue({
                                  userId,
                                  payload: Webhook.generatePayload({
                                    event: 'network-joined',
                                    networkId: instanceId,
                                    userId,
                                  }),
                                });
                                myFuture.return(id);
                              }
                            }
                          );
                        }
                      });
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
    return myFuture.wait();
  },
  convertIP_Location: function(ips) {
    let result = [];

    ips.forEach((ip, index) => {
      let geo = geoip.lookup(ip);
      if (geo) {
        geo.ip = ip;
        result.push(geo);
      }
    });

    return result;
  },
  changeNodeName: function(instanceId, newName) {
    Networks.update(
      {
        instanceId: instanceId,
      },
      {
        $set: {
          name: newName,
        },
      }
    );
  },
  vote: function(networkId, toVote) {
    var myFuture = new Future();
    var network = Networks.find({
      _id: networkId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/utility/vote`,
      {
        content: JSON.stringify({
          toVote: toVote,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  unVote: function(networkId, toUnvote) {
    var myFuture = new Future();
    var network = Networks.find({
      _id: networkId,
    }).fetch()[0];
    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/utility/unVote`,
      {
        content: JSON.stringify({
          toUnvote: toUnvote,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  createAccount: function(name, password, networkId) {
    var myFuture = new Future();
    var network = Networks.find({
      _id: networkId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/utility/createAccount`,
      {
        content: JSON.stringify({
          name: name,
          password: password,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          console.log(typeof response.content);
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  addSmartContract: function(name, bytecode, abi, networkId) {
    var myFuture = new Future();
    var network = Networks.find({
      _id: networkId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/contracts/addOrUpdate`,
      {
        content: JSON.stringify({
          name: name,
          bytecode: bytecode,
          abi: abi,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  inviteUserToNetwork: async function(networkId, nodeType, email, userId) {
    return UserFunctions.inviteUserToNetwork(networkId, nodeType, email, userId || Meteor.userId());
  },
  createAssetType: function(instanceId, assetName, assetType, assetIssuer, reissuable, parts) {
    this.unblock();
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/createAssetType`,
      {
        content: JSON.stringify({
          assetName: assetName,
          assetType: assetType,
          fromAccount: assetIssuer,
          reissuable: reissuable,
          parts: parts,
          description: '',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            console.log(responseBody);
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  issueBulkAssets: function(networkId, assetName, fromAddress, toAddress, units) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: networkId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/issueBulkAsset`,
      {
        content: JSON.stringify({
          fromAccount: fromAddress,
          assetName: assetName,
          toAccount: toAddress,
          units: units,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  issueSoloAsset: function(instanceId, assetName, fromAddress, toAddress, identifier) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/issueSoloAsset`,
      {
        content: JSON.stringify({
          assetName: assetName,
          toAccount: toAddress,
          identifier: identifier,
          data: {},
          fromAccount: fromAddress,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  transferBulkAssets: function(instanceId, assetName, fromAddress, toAddress, units) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/transferBulkAsset`,
      {
        content: JSON.stringify({
          fromAccount: fromAddress,
          toAccount: toAddress,
          assetName: assetName,
          description: '',
          units: units,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  transferSoloAsset: function(instanceId, assetName, fromAddress, toAddress, identifier) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/transferSoloAsset`,
      {
        content: JSON.stringify({
          fromAccount: fromAddress,
          toAccount: toAddress,
          assetName: assetName,
          identifier: identifier,
          description: '',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  getBulkAssetBalance: function(instanceId, assetName, address) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/getBulkAssetBalance`,
      {
        content: JSON.stringify({
          assetName: assetName,
          account: address,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return(responseBody.units.toString());
          }
        }
      }
    );

    return myFuture.wait();
  },
  getSoloAssetInfo: function(instanceId, assetName, identifier) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/getSoloAssetInfo`,
      {
        content: JSON.stringify({
          assetName: assetName,
          identifier: identifier,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          console.log(response);
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return(responseBody);
          }
        }
      }
    );

    return myFuture.wait();
  },
  addUpdateSoloAssetInfo: function(instanceId, assetName, fromAddress, identifier, key, value, visibility) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    if (visibility === 'private') {
      var obj = {
        private: {
          [key]: value,
        },
        assetName: assetName,
        identifier: identifier,
        fromAccount: fromAddress,
      };
    } else {
      var obj = {
        public: {
          [key]: value,
        },
        assetName: assetName,
        identifier: identifier,
        fromAccount: fromAddress,
      };
    }

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/updateAssetInfo`,
      {
        content: JSON.stringify(obj),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  grantAccess: function(instanceId, assetName, identifier, publicKey, fromAddress) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/grantAccessToPrivateData`,
      {
        content: JSON.stringify({
          assetName: assetName,
          identifier: identifier,
          publicKey: publicKey,
          fromAccount: fromAddress,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  revokeAccess: function(instanceId, assetName, identifier, publicKey, fromAddress) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/revokeAccessToPrivateData`,
      {
        content: JSON.stringify({
          assetName: assetName,
          identifier: identifier,
          publicKey: publicKey,
          fromAccount: fromAddress,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  closeAsset: function(instanceId, assetName, fromAddress, identifier) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/closeAsset`,
      {
        content: JSON.stringify({
          fromAccount: fromAddress,
          identifier: identifier,
          assetName: assetName,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  placeOrder: function(
    instanceId,
    fromType,
    toType,
    fromId,
    toId,
    fromUnits,
    toUnits,
    fromUniqueIdentifier,
    toUniqueIdentifier,
    fromAddress,
    toAddress,
    toGenesisBlockHash,
    lockMinutes,
    otherInstanceId
  ) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/placeOrder`,
      {
        content: JSON.stringify({
          toNetworkId: otherInstanceId,
          fromAssetType: fromType,
          fromAssetName: fromId,
          fromAssetUniqueIdentifier: fromUniqueIdentifier,
          fromAssetUnits: fromUnits,
          fromAssetLockMinutes: lockMinutes,
          toAssetType: toType,
          toAssetName: toId,
          toAssetUnits: toUnits,
          toAssetUniqueIdentifier: toUniqueIdentifier,
          fromAccount: fromAddress,
          toAddress: toAddress,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  fullfillOrder: function(
    instanceId,
    buyerInstanceId,
    fromType,
    toType,
    fromId,
    toId,
    fromUnits,
    toUnits,
    fromUniqueIdentifier,
    toUniqueIdentifier,
    fromAddress,
    toAddress,
    toGenesisBlockHash,
    lockMinutes,
    hash
  ) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/fulfillOrder`,
      {
        content: JSON.stringify({
          orderId: hash,
          toNetworkId: buyerInstanceId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          console.log(response);
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  claimOrder: function(instanceId, atomicSwapHash, fromAddress, toAssetType, toAssetName, toAssetId, toAssetUnits) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/fulfillOrder`,
      {
        content: JSON.stringify({
          orderId: atomicSwapHash,
          toNetworkId: instanceId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          console.log(response);
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  cancelOrder: function(instanceId, orderId, fromAddress) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];
    let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));
    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);
    var atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
    var atomicSwap = atomicSwapContract.at(network.atomicSwapContractAddress);

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/cancelOrder`,
      {
        content: JSON.stringify({
          orderId: orderId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  searchSoloAssets: function(instanceId, query) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/search`,
      {
        content: JSON.stringify(JSON.parse(query)),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          console.log(response);
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return(responseBody);
          }
        }
      }
    );

    return myFuture.wait();
  },
  rpcPasswordUpdate: function(instanceId, password, locationCode = 'us-west-2') {
    var myFuture = new Future();

    if (password) {
      HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets/` + 'basic-auth-' + instanceId, function(error, response) {
        let encryptedPassword = md5(password);
        let auth = base64.encode(utf8.encode(instanceId + ':' + encryptedPassword));
        HTTP.call(
          'POST',
          `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets`,
          {
            content: JSON.stringify({
              apiVersion: 'v1',
              data: {
                auth: auth,
              },
              kind: 'Secret',
              metadata: {
                name: 'basic-auth-' + instanceId,
              },
              type: 'Opaque',
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          },
          function(error) {
            if (error) {
              console.log(error);
              myFuture.throw('An unknown error occured while creating secret');
            } else {
              HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses/` + 'ingress-' + instanceId, function(
                error,
                response
              ) {
                if (error) {
                  console.log(error);
                  myFuture.throw('An unknown error occured');
                } else {
                  HTTP.call(
                    'POST',
                    `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses`,
                    {
                      content: JSON.stringify({
                        apiVersion: 'extensions/v1beta1',
                        kind: 'Ingress',
                        metadata: {
                          name: 'ingress-' + instanceId,
                          annotations: {
                            'nginx.ingress.kubernetes.io/rewrite-target': '/',
                            'nginx.ingress.kubernetes.io/auth-type': 'basic',
                            'nginx.ingress.kubernetes.io/auth-secret': 'basic-auth-' + instanceId,
                            'nginx.ingress.kubernetes.io/auth-realm': 'Authentication Required',
                            'nginx.ingress.kubernetes.io/enable-cors': 'true',
                            'nginx.ingress.kubernetes.io/cors-credentials': 'true',
                            'kubernetes.io/ingress.class': 'nginx',
                            'nginx.ingress.kubernetes.io/configuration-snippet': `set $cors \"true\";\n# Nginx doesn't support nested If statements. This is where things get slightly nasty.\n# Determine the HTTP request method used\nif ($request_method = 'OPTIONS') {\n    set $cors \"\${cors}options\";\n}\nif ($request_method = 'GET') {\n    set $cors \"\${cors}get\";\n}\nif ($request_method = 'POST') {\n    set $cors \"\${cors}post\";\n}\n\nif ($cors = \"true\") {\n    # Catch all incase there's a request method we're not dealing with properly\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n}\n\nif ($cors = \"trueoptions\") {\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n\n    #\n    # Om nom nom cookies\n    #\n    add_header 'Access-Control-Allow-Credentials' 'true';\n    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';\n\n    #\n    # Custom headers and headers various browsers *should* be OK with but aren't\n    #\n    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';\n\n    #\n    # Tell client that this pre-flight info is valid for 20 days\n    #\n    add_header 'Access-Control-Max-Age' 1728000;\n    add_header 'Content-Type' 'text/plain charset=UTF-8';\n    add_header 'Content-Length' 0;\n    return 204;\n}`,
                          },
                        },
                        spec: {
                          tls: [
                            {
                              hosts: [Config.workerNodeDomainName(locationCode)],
                              secretName: 'blockcluster-ssl',
                            },
                          ],
                          rules: [
                            {
                              host: Config.workerNodeDomainName(locationCode),
                              http: {
                                paths: [
                                  {
                                    path: '/api/node/' + instanceId + '/jsonrpc',
                                    backend: {
                                      serviceName: instanceId,
                                      servicePort: 8545,
                                    },
                                  },
                                  {
                                    path: '/api/node/' + instanceId,
                                    backend: {
                                      serviceName: instanceId,
                                      servicePort: 6382,
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
                    function(error) {
                      if (error) {
                        console.log(error);
                        deleteNetwork(id);
                      } else {
                        Networks.update(
                          {
                            instanceId: instanceId,
                          },
                          {
                            $set: {
                              'api-password': password,
                            },
                          }
                        );

                        myFuture.return();
                      }
                    }
                  );
                }
              });
            }
          }
        );
      });
    } else {
      HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets/` + 'basic-auth-' + instanceId, function(error, response) {
        HTTP.call('DELETE', `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses/` + 'ingress-' + instanceId, function(
          error,
          response
        ) {
          if (error) {
            console.log(error);
            myFuture.throw('An unknown error occured');
          } else {
            HTTP.call(
              'POST',
              `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses`,
              {
                content: JSON.stringify({
                  apiVersion: 'extensions/v1beta1',
                  kind: 'Ingress',
                  metadata: {
                    name: 'ingress-' + instanceId,
                    annotations: {
                      'nginx.ingress.kubernetes.io/rewrite-target': '/',
                      'nginx.ingress.kubernetes.io/enable-cors': 'true',
                      'nginx.ingress.kubernetes.io/cors-credentials': 'true',
                      'kubernetes.io/ingress.class': 'nginx',
                      'nginx.ingress.kubernetes.io/configuration-snippet': `set $cors \"true\";\n# Nginx doesn't support nested If statements. This is where things get slightly nasty.\n# Determine the HTTP request method used\nif ($request_method = 'OPTIONS') {\n    set $cors \"\${cors}options\";\n}\nif ($request_method = 'GET') {\n    set $cors \"\${cors}get\";\n}\nif ($request_method = 'POST') {\n    set $cors \"\${cors}post\";\n}\n\nif ($cors = \"true\") {\n    # Catch all incase there's a request method we're not dealing with properly\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n}\n\nif ($cors = \"trueoptions\") {\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n\n    #\n    # Om nom nom cookies\n    #\n    add_header 'Access-Control-Allow-Credentials' 'true';\n    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';\n\n    #\n    # Custom headers and headers various browsers *should* be OK with but aren't\n    #\n    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';\n\n    #\n    # Tell client that this pre-flight info is valid for 20 days\n    #\n    add_header 'Access-Control-Max-Age' 1728000;\n    add_header 'Content-Type' 'text/plain charset=UTF-8';\n    add_header 'Content-Length' 0;\n    return 204;\n}`,
                    },
                  },
                  spec: {
                    tls: [
                      {
                        hosts: [Config.workerNodeDomainName(locationCode)],
                        secretName: 'blockcluster-ssl',
                      },
                    ],
                    rules: [
                      {
                        host: Config.workerNodeDomainName(locationCode),
                        http: {
                          paths: [
                            {
                              path: '/api/node/' + instanceId + '/jsonrpc',
                              backend: {
                                serviceName: instanceId,
                                servicePort: 8545,
                              },
                            },
                            {
                              path: '/api/node/' + instanceId,
                              backend: {
                                serviceName: instanceId,
                                servicePort: 6382,
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
              function(error) {
                if (error) {
                  console.log(error);
                  deleteNetwork(id);
                } else {
                  Networks.update(
                    {
                      instanceId: instanceId,
                    },
                    {
                      $set: {
                        'api-password': password,
                      },
                    }
                  );

                  myFuture.return();
                }
              }
            );
          }
        });
      });
    }

    return myFuture.wait();
  },
  whitelistPeer: function(instanceId, eNodeURL) {
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    var myFuture = new Future();

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/utility/whitelistPeer`,
      {
        content: JSON.stringify({
          url: eNodeURL,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  blacklistPeer: function(instanceId, eNodeURL) {
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    var myFuture = new Future();

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/utility/removeWhitelistedPeer`,
      {
        content: JSON.stringify({
          url: eNodeURL,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  addPeer: function(instanceId, eNodeURL) {
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    var myFuture = new Future();

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/utility/addPeer`,
      {
        content: JSON.stringify({
          url: eNodeURL,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  removePeer: function(instanceId, eNodeURL) {
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    var myFuture = new Future();

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/utility/removePeer`,
      {
        content: JSON.stringify({
          url: eNodeURL,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  createStream: function(instanceId, name, issuer) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/streams/create`,
      {
        content: JSON.stringify({
          streamName: name,
          fromAccount: issuer,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return();
          }
        }
      }
    );

    return myFuture.wait();
  },
  publishStream: function(instanceId, name, issuer, key, data, visibility, publicKeys) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/streams/publish`,
      {
        content: JSON.stringify({
          visibility: visibility,
          fromAccount: issuer,
          streamName: name,
          key: key,
          data: data,
          publicKeys: publicKeys.split(','),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          console.log(response);
          myFuture.return();
        }
      }
    );

    return myFuture.wait();
  },
  addPublisher: function(instanceId, streamName, newPublisher, fromAccount) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/streams/grantAccessToPublish`,
      {
        content: JSON.stringify({
          streamName: streamName,
          publisher: newPublisher,
          fromAccount: fromAccount,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          console.log(response);
          myFuture.return();
        }
      }
    );

    return myFuture.wait();
  },
  removePublisher: function(instanceId, streamName, removePublisher, fromAccount) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/streams/revokeAccessToPublish`,
      {
        content: JSON.stringify({
          streamName: streamName,
          publisher: removePublisher,
          fromAccount: fromAccount,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          console.log(response);
          myFuture.return();
        }
      }
    );

    return myFuture.wait();
  },
  grantAccessStream: function(instanceId, name, address, from) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/streams/grantAccessToPublish`,
      {
        content: JSON.stringify({
          streamName: name,
          publisher: address,
          fromAccount: from,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          console.log(response);
          myFuture.return();
        }
      }
    );

    return myFuture.wait();
  },
  revokeAccessStream: function(instanceId, name, address, from) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/streams/revokeAccessToPublish`,
      {
        content: JSON.stringify({
          streamName: name,
          publisher: address,
          fromAccount: from,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          console.log(response);
          myFuture.return();
        }
      }
    );

    return myFuture.wait();
  },
  updateAssetTypeCreatedNotifyURL: function(instanceId, url) {
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    var notificationURLs = network.notificationURLs || {};
    notificationURLs.assetTypeCreated = url;

    Networks.update(
      {
        instanceId: instanceId,
      },
      {
        $set: {
          notificationURLs: notificationURLs,
        },
      }
    );
  },
  downloadAccount: function(instanceId, accountAddress) {
    var myFuture = new Future();

    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/utility/getPrivateKey`,
      {
        content: JSON.stringify({
          address: accountAddress,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw('An unknown error occured');
        } else {
          myFuture.return(response.content);
        }
      }
    );
    return myFuture.wait();
  },
  downloadReport: function(instanceId, assetName, uID) {
    var myFuture = new Future();
    var network = Networks.find({
      instanceId: instanceId,
    }).fetch()[0];

    HTTP.call(
      'POST',
      `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/audit`,
      {
        content: JSON.stringify({
          assetName: assetName,
          uniqueIdentifier: uID,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      function(error, response) {
        if (error) {
          myFuture.throw(error);
        } else {
          let responseBody = JSON.parse(response.content);
          if (responseBody.error) {
            myFuture.throw(responseBody.error);
          } else {
            myFuture.return(responseBody);
          }
        }
      }
    );

    return myFuture.wait();
  },
  updateNodeCallbackURL: function(instanceId, callbackURL) {
    Networks.update(
      {
        instanceId: instanceId,
      },
      {
        $set: {
          callbackURL: callbackURL,
        },
      }
    );
  },
  updateNetworksCallbackURL: function(callbackURL) {
    console.log(this.userId, callbackURL);
    Meteor.users.update(
      { _id: this.userId },
      {
        $set: {
          'profile.notifyURL': callbackURL,
        },
      }
    );
  },
});

Meteor.startup(() => {
  serverStartup();
});

const LOCK_FILE_PATH = '/tmp/webapp.lock';
function serverStartup() {
  Migrations.migrateTo(Config.migrationVersion);
  fs.writeFileSync(LOCK_FILE_PATH, `Server started at  ${new Date()}`);
}

function serverStop() {
  try {
    if (fs.existsSync(LOCK_FILE_PATH)) {
      // fs.unlinkSync(LOCK_FILE_PATH);
    }
  } catch (err) {
    console.log(err);
  }
}

process.on('exit', () => {
  console.log('Exiting');
  serverStop();
});

process.on('uncaughtException', e => {
  console.log('Uncaught exception', e);
  serverStop();
});
