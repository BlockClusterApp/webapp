require("../imports/startup/server/")
require('../imports/api/emails/email-validator')
require('../imports/api/emails/forgot-password')
require('../imports/api/locations');
require('../imports/modules/migrations/server');
require('../imports/api');
const debug = require('debug')('webapp:server:main');

console.log("env", process.env.NODE_ENV);

import UserFunctions from '../imports/api/server-functions/user-functions';
import {
    Networks
} from "../imports/collections/networks/networks.js"
import NetworkFunctions from '../imports/api/network/networks';
import Vouchers from '../imports/collections/vouchers/voucher';
import NetworkConfiguration from '../imports/collections/network-configuration/network-configuration';
import {
    SoloAssets
} from "../imports/collections/soloAssets/soloAssets.js"
import {
    StreamsItems
} from "../imports/collections/streamsItems/streamsItems.js"
import {
    Streams
} from "../imports/collections/streams/streams.js"
import {
    AssetTypes
} from "../imports/collections/assetTypes/assetTypes.js"
import {
    Orders
} from "../imports/collections/orders/orders.js"
import {
    Secrets
} from "../imports/collections/secrets/secrets.js"
import {
    AcceptedOrders
} from "../imports/collections/acceptedOrders/acceptedOrders.js"
import {
    BCAccounts
} from "../imports/collections/bcAccounts/bcAccounts.js"
import {
    SoloAssetAudit
} from "../imports/collections/soloAssetAudit/soloAssetAudit.js"

import {
    DerivationKeys
} from "../imports/collections/derivationKeys/derivationKeys.js"
import {
    EncryptedObjects
} from "../imports/collections/encryptedObjects/encryptedObjects.js"
import {
    EncryptionKeys
} from "../imports/collections/encryptionKeys/encryptionKeys.js"

import Verifier from '../imports/api/emails/email-validator'
import Config from '../imports/modules/config/server';

var Future = Npm.require("fibers/future");
var lightwallet = Npm.require("eth-lightwallet");
import Web3 from "web3";
var jsonminify = require("jsonminify");
import helpers from "../imports/modules/helpers"
import server_helpers from "../imports/modules/helpers/server"
import smartContracts from "../imports/modules/smart-contracts"
import {
    scanBlocksOfNode,
    authoritiesListCronJob
} from "../imports/collections/networks/server/cron.js"
import fs from 'fs';
var md5 = require("apache-md5");
var base64 = require('base-64');
var utf8 = require('utf8');
var BigNumber = require('bignumber.js');

Accounts.validateLoginAttempt(function(options) {
    if (!options.allowed) {
        return false;
    }

    if (options.methodName == "createUser") {
        throw new Meteor.Error("unverified-account-created", "Account created but cannot be logged in until verified");
    }

    if (options.user.emails[0].verified === true) {
        return true;
    } else {
        throw new Meteor.Error("email-not-verified", "Your email is not approved by the administrator.");
    }
});

Accounts.onCreateUser(function(options, user) {
    user.firstLogin = false;
    user.profile = options.profile || {};

    // Assigns first and last names to the newly created user object
    user.profile.firstName = options.profile.firstName;
    user.profile.lastName = options.profile.lastName;

    if(!(!options.profile.firstName || options.profile.firstName === "null" || options.profile.firstName === "undefined")){
        Verifier.sendEmailVerification(user);
    }

    return user;
});


function getNodeConfig(networkConfig, userId) {
  let nodeConfig = {};
  let finalNetworkConfig = undefined;
  const { voucher, config, diskSpace } = networkConfig;
  if(voucher) {
    const _voucher = Vouchers.find({
      _id: voucher._id
    }).fetch()[0];

    if(_voucher) {
      nodeConfig.voucherId = _voucher._id;
      nodeConfig.voucher = _voucher;
      finalNetworkConfig = _voucher.networkConfig;
      if(_voucher.isDiskChangeable) {
        finalNetworkConfig = diskSpace || _voucher.diskSpace;
      }
    }

    Vouchers.update({
      _id: voucher._id
    }, {
      $set: {
        claimedBy: userId,
        claimedOn: new Date(),
        claimed: true
      }
    });
  }

  if(!finalNetworkConfig && config) {
    const _config = NetworkConfiguration.find({
      _id: config._id
    }).fetch()[0];
    if(_config) {
      nodeConfig.configId = _config._id;
      nodeConfig.networkConfig = _config;
      finalNetworkConfig = _config;
      if(_config.isDiskChangeable) {
        finalNetworkConfig.disk = diskSpace || _config.diskSpace;
      }
    }
  }

  if(!finalNetworkConfig){
    return nodeConfig;
  }

  debug("Returning node config", networkConfig, userId);

  nodeConfig = {
    ...nodeConfig,
    cpu: finalNetworkConfig.cpu * 1000,
    ram: finalNetworkConfig.ram,
    disk: finalNetworkConfig.disk
  };



  return nodeConfig;
}

function getContainerResourceLimits({cpu, ram }){
  const CpuPercentage = {
    mongo: 0.15,
    impulse: 0.20,
    dynamo: 0.65
  }

  const RamPercentage = {
    mongo: 0.05,
    impulse: 0.15,
    dynamo: 0.8
  }

  const config = {
    mongo: {
      cpu: Math.floor(cpu * CpuPercentage.mongo),
      ram: Math.floor(ram * RamPercentage.mongo * 1000) / 1000
    },
    dynamo: {
      cpu: Math.floor(cpu * CpuPercentage.dynamo),
      ram: Math.floor(ram * RamPercentage.dynamo * 1000) / 1000
    },
    impulse: {
      cpu: Math.floor(cpu * CpuPercentage.impulse),
      ram: Math.floor(ram * RamPercentage.impulse * 1000) / 1000
    }
  };

  debug("Container limits", config);

  return config;
}

Meteor.methods({
    "createNetwork": function(networkName,  locationCode, networkConfig, userId) {
      debug("CreateNetwork | Arguments", networkName, locationCode, networkConfig, userId);
        var myFuture = new Future();

        // const microNodes = Networks.find({
        //   user: Meteor.userId(),
        //   active: true,
        //   "networkConfig.cpu": 500
        // }).fetch();

        const isMicro = networkConfig && ((networkConfig.config && networkConfig.config.cpu === 0.5) || (networkConfig.voucher && networkConfig.voucher.cpu === 0.5));
        // if(microNodes.length > 2 && isMicro) {
        //   throw new Meteor.Error('Can have maximum of 2 micro nodes only');
        // }

        var instanceId = helpers.instanceIDGenerate();

        if(!locationCode){
            locationCode = "us-west-2";
        }

        function deleteNetwork(id) {
            debug("CreateNetwork | Deleting network", id);
            Networks.update({
                _id: id
            }, {
              $set: {
                active: false,
                deletedAt: new Date().getTime()
              }
            });
            NetworkFunctions.cleanNetworkDependencies(id);
            HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/deployments/` + instanceId, function(error, response) {});
            HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + instanceId, function(error, response) {});
            HTTP.call("GET", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets?labelSelector=app%3D` + encodeURIComponent("dynamo-node-" + instanceId), function(error, response) {
                if (!error) {
                    if (JSON.parse(response.content).items.length > 0) {
                        HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets/` + JSON.parse(response.content).items[0].metadata.name, function(error, response) {
                            HTTP.call("GET", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3D` + encodeURIComponent("dynamo-node-" + instanceId), function(error, response) {
                                if (!error) {
                                    if (JSON.parse(response.content).items.length > 0) {
                                        HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods/` + JSON.parse(response.content).items[0].metadata.name, function(error, response) {
                                            HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets/` + "basic-auth-" + instanceId, function(error, response) {})
                                            HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses/` + "ingress-" + instanceId, function(error, response) {})
                                            HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/persistentvolumeclaims/` + `${instanceId}-pvc`, function(error, response) {});
                                            BCAccounts.remove({
                                                instanceId: id
                                            })
                                        })
                                    }
                                }
                            })
                        })
                    }
                }
            });

        }

        const nodeConfig = getNodeConfig(networkConfig);
        if(!nodeConfig.cpu) {
          throw new Meteor.Error("Invalid Network Configuration");
        }

        const resourceConfig = getContainerResourceLimits({cpu: nodeConfig.cpu, ram: nodeConfig.ram});

        const networkProps = {
          "instanceId": instanceId,
          "name": networkName,
          "type": "new",
          "peerType": "authority",
          "workerNodeIP": Config.workerNodeIP(locationCode),
          "user": userId ? userId : this.userId,
          "createdOn": Date.now(),
          "totalENodes": [],
          "locationCode": locationCode,
          voucherId: nodeConfig.voucherId,
          networkConfigId: nodeConfig.configId,
          metadata: {
            voucher: nodeConfig.voucher,
            networkConfig: nodeConfig.networkConfig
          },
          networkConfig: {cpu: nodeConfig.cpu, ram: nodeConfig.ram, disk: nodeConfig.disk}
        };

        debug("CreateNetwork | Network insert ", networkProps);

        Networks.insert(networkProps, (error, id) => {
            if (error) {
                console.log(error);
                myFuture.throw("An unknown error occured");
            } else {
                HTTP.call("POST", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/persistentvolumeclaims`, {
                  content: JSON.stringify({
                    apiVersion: "v1",
                    kind: "PersistentVolumeClaim",
                    metadata: {
                      name: `${instanceId}-pvc`
                    },
                    spec:{
                      accessModes: [
                        "ReadWriteOnce"
                      ],
                      resources: {
                        requests: {
                          storage: `${nodeConfig.disk}Gi`
                        }
                      },
                      storageClassName: "gp2-storage-class"
                    }
                  }),
                  headers: {
                      "Content-Type": "application/json"
                  }
                }, (err, response) => {
                  if(err){
                    console.log(err);
                    throw new Meteor.Error("Error allocating storage");
                  }
                  HTTP.call("POST", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta1/namespaces/${Config.namespace}/deployments`, {
                      "content": JSON.stringify({
                          "apiVersion":"apps/v1beta1",
                          "kind":"Deployment",
                          "metadata":{
                              "name": instanceId
                          },
                          "spec":{
                              "replicas":1,
                              "revisionHistoryLimit":10,
                              "template":{
                                  "metadata":{
                                      "labels":{
                                          "app":"dynamo-node-" + instanceId
                                      }
                                  },
                                  "spec":{
                                      "containers":[
                                          {
                                              "name":"mongo",
                                              "image":`mongo`,
                                              "imagePullPolicy":"IfNotPresent",
                                              "ports":[
                                                  {
                                                      "containerPort":27017
                                                  }
                                              ],
                                              "resources": {
                                                "requests": {
                                                  "cpu": `${resourceConfig.mongo.cpu}m`,
                                                  "memory": `${resourceConfig.mongo.ram}Gi`
                                                },
                                                "limits": {
                                                  "cpu": `${resourceConfig.mongo.cpu + 150}m`,
                                                  "memory": `${resourceConfig.mongo.ram + 0.2}Gi`
                                                }
                                              },
                                              "volumeMounts": [
                                                {
                                                  "name": "dynamo-dir",
                                                  "mountPath": "/data/db"
                                                }
                                              ],
                                          },
                                          {
                                              "name":"dynamo",
                                              "image":`402432300121.dkr.ecr.us-west-2.amazonaws.com/dynamo:${process.env.NODE_ENV || "dev"}`,
                                              "command":[
                                                "/bin/bash",
                                                "-i",
                                                "-c",
                                                "./setup.sh"
                                              ],
                                              "env":[
                                                  {
                                                      "name": "instanceId",
                                                      "value": instanceId
                                                  },
                                                  {
                                                      "name": "MONGO_URL",
                                                      "value": `${process.env.MONGO_URL}`
                                                  },
                                                  {
                                                      "name": "WORKER_NODE_IP",
                                                      "value": `${Config.workerNodeIP(locationCode)}`
                                                  }
                                              ],
                                              "imagePullPolicy":"Always",
                                              "ports":[
                                                  {
                                                      "containerPort":8545
                                                  },
                                                  {
                                                      "containerPort":23000
                                                  },
                                                  {
                                                      "containerPort":9001
                                                  },
                                                  {
                                                      "containerPort":6382
                                                  }
                                              ],
                                              "volumeMounts": [
                                                {
                                                  "name": "dynamo-dir",
                                                  "mountPath": "/dynamo/bcData"
                                                }
                                              ],
                                              "resources": {
                                                "requests": {
                                                  "cpu": `${resourceConfig.dynamo.cpu}m`,
                                                  "memory": `${resourceConfig.dynamo.ram}Gi`
                                                },
                                                "limits": {
                                                  "cpu": `${resourceConfig.dynamo.cpu}m`,
                                                  "memory": `${resourceConfig.dynamo.ram + 0.2}Gi`
                                                }
                                              },
                                              "lifecycle": {
                                                  "postStart": {
                                                      "exec": {
                                                          "command": [
                                                              "/bin/bash",
                                                              "-c",
                                                              "node ./apis/postStart.js"
                                                          ]
                                                      }
                                                  },
                                                  "preStop": {
                                                      "exec": {
                                                          "command": [
                                                              "/bin/bash",
                                                              "-c",
                                                              "node ./apis/preStop.js"
                                                          ]
                                                      }
                                                  }
                                              }
                                          },
                                          {
                                            "name":"impulse",
                                            "image":`402432300121.dkr.ecr.us-west-2.amazonaws.com/impulse:${process.env.NODE_ENV || "dev"}`,
                                            "env":[
                                                {
                                                    "name": "instanceId",
                                                    "value": instanceId
                                                },
                                                {
                                                    "name": "MONGO_URL",
                                                    "value": `${process.env.MONGO_URL}`
                                                },
                                                {
                                                    "name": "WORKER_NODE_IP",
                                                    "value": `${Config.workerNodeIP(locationCode)}`
                                                }
                                            ],
                                            "resources": {
                                              "requests": {
                                                "cpu": `${resourceConfig.impulse.cpu}m`,
                                                "memory": `${resourceConfig.impulse.ram}Gi`
                                              },
                                              "limits": {
                                                "cpu": `${resourceConfig.impulse.cpu}m`,
                                                "memory": `${resourceConfig.impulse.ram + 0.2}Gi`
                                              }
                                            },
                                            "lifecycle": {
                                                "postStart": {
                                                    "exec": {
                                                        "command": [
                                                            "/bin/bash",
                                                            "-c",
                                                            "node /impulse/postStart.js"
                                                        ]
                                                    }
                                                },
                                                "preStop": {
                                                    "exec": {
                                                        "command": [
                                                            "/bin/bash",
                                                            "-c",
                                                            "node /impulse/preStop.js"
                                                        ]
                                                    }
                                                }
                                            },
                                            "imagePullPolicy":"Always",
                                            "ports":[
                                                {
                                                    "containerPort":7558
                                                }
                                            ]
                                        }
                                      ],
                                      "volumes": [
                                        {
                                          "name": "dynamo-dir",
                                          "persistentVolumeClaim": {
                                            "claimName": `${instanceId}-pvc`
                                          }
                                        }
                                      ],
                                      "imagePullSecrets":[
                                        {
                                            "name":"regsecret"
                                        }
                                      ]
                                }
                            }
                        }
                    }),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }, function(error, response) {
                    if (error) {
                        console.log(error);
                        deleteNetwork(id)
                    } else {
                        HTTP.call("POST", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services`, {
                            "content": JSON.stringify({
                                "kind":"Service",
                                "apiVersion":"v1",
                                "metadata":{
                                    "name": instanceId
                                },
                                "spec":{
                                    "ports":[
                                        {
                                            "name":"rpc",
                                            "port":8545
                                        },
                                        {
                                            "name":"eth",
                                            "port":23000
                                        },
                                        {
                                            "name":"apis",
                                            "port":6382
                                        },
                                        {
                                            "name":"impulse",
                                            "port":7558
                                        }
                                    ],
                                    "selector":{
                                        "app":"dynamo-node-" + instanceId
                                    },
                                    "type":"NodePort"
                                }
                            }),
                            "headers": {
                                "Content-Type": "application/json"
                            }
                        }, (error, response) => {
                            if (error) {
                                console.log(error);
                                deleteNetwork(id)
                            } else {
                                HTTP.call("GET", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + instanceId, {}, (error, response) => {
                                    if (error) {
                                        console.log(error);
                                        deleteNetwork(id)
                                    } else {
                                        let rpcNodePort = response.data.spec.ports[0].nodePort

                                        Networks.update({
                                            _id: id
                                        }, {
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
                                                impulseURL: "http://" + Config.workerNodeIP(locationCode) + ":" + response.data.spec.ports[3].nodePort
                                            }
                                        });
                                        let encryptedPassword = md5(instanceId);
                                        let auth = base64.encode(utf8.encode(instanceId + ":" + encryptedPassword))
                                        HTTP.call("POST", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets`, {
                                            "content": JSON.stringify({
                                                "apiVersion": "v1",
                                                "data": {
                                                    "auth": auth
                                                },
                                                "kind": "Secret",
                                                "metadata": {
                                                    "name": "basic-auth-" + instanceId,
                                                    "namespace": Config.namespace
                                                },
                                                "type": "Opaque"
                                            }),
                                            "headers": {
                                                "Content-Type": "application/json"
                                            }
                                        }, (error) => {
                                            if (error) {
                                                console.log(error);
                                                deleteNetwork(id)
                                            } else {
                                                HTTP.call("POST", `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses`, {
                                                        "content": JSON.stringify({
                                                            "apiVersion": "extensions/v1beta1",
                                                            "kind": "Ingress",
                                                            "metadata": {
                                                                "name": "ingress-" + instanceId,
                                                                "annotations": {
                                                                    "nginx.ingress.kubernetes.io/rewrite-target": "/",
                                                                    "nginx.ingress.kubernetes.io/auth-type": "basic",
                                                                    "nginx.ingress.kubernetes.io/auth-secret": "basic-auth-" + instanceId,
                                                                    "nginx.ingress.kubernetes.io/auth-realm": "Authentication Required",
                                                                    "nginx.ingress.kubernetes.io/enable-cors": "true",
                                                                    "nginx.ingress.kubernetes.io/cors-credentials": "true",
                                                                    "kubernetes.io/ingress.class": "nginx",
                                                                    "nginx.ingress.kubernetes.io/configuration-snippet": `if ($http_origin ~* (^https?://([^/]+\\.)*(localhost:3000|${Config.workerNodeDomainName()}))) {\n    set $cors \"true\";\n}\n# Nginx doesn't support nested If statements. This is where things get slightly nasty.\n# Determine the HTTP request method used\nif ($request_method = 'OPTIONS') {\n    set $cors \"\${cors}options\";\n}\nif ($request_method = 'GET') {\n    set $cors \"\${cors}get\";\n}\nif ($request_method = 'POST') {\n    set $cors \"\${cors}post\";\n}\n\nif ($cors = \"true\") {\n    # Catch all incase there's a request method we're not dealing with properly\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n}\n\nif ($cors = \"trueoptions\") {\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n\n    #\n    # Om nom nom cookies\n    #\n    add_header 'Access-Control-Allow-Credentials' 'true';\n    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';\n\n    #\n    # Custom headers and headers various browsers *should* be OK with but aren't\n    #\n    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';\n\n    #\n    # Tell client that this pre-flight info is valid for 20 days\n    #\n    add_header 'Access-Control-Max-Age' 1728000;\n    add_header 'Content-Type' 'text/plain charset=UTF-8';\n    add_header 'Content-Length' 0;\n    return 204;\n}`
                                                                }
                                                            },
                                                            "spec": {
                                                                "tls": [
                                                                    {
                                                                        "hosts": [
                                                                            Config.workerNodeDomainName(locationCode)
                                                                        ],
                                                                        "secretName": "blockcluster-ssl"
                                                                    }
                                                                ],
                                                                "rules": [{
                                                                    "host": Config.workerNodeDomainName(locationCode),
                                                                    "http": {
                                                                        "paths": [{
                                                                            "path": "/api/node/" + instanceId + "/jsonrpc",
                                                                            "backend": {
                                                                                "serviceName": instanceId,
                                                                                "servicePort": 8545
                                                                            }
                                                                        },
                                                                        {
                                                                            "path": "/api/node/" + instanceId,
                                                                            "backend": {
                                                                                "serviceName": instanceId,
                                                                                "servicePort": 6382
                                                                            }
                                                                        }]
                                                                    }
                                                                }]
                                                            }
                                                        }),
                                                        "headers": {
                                                            "Content-Type": "application/json"
                                                        }
                                                    },
                                                    (error) => {
                                                        if (error) {
                                                            console.log(error);
                                                            deleteNetwork(id)
                                                        } else {
                                                            Networks.update({
                                                                _id: id
                                                            }, {
                                                                $set: {
                                                                    "api-password": instanceId
                                                                }
                                                            })

                                                            myFuture.return(instanceId);
                                                        }
                                                    })
                                                  }
                                        })
                                    }
                                })
                            }
                        })
                    }
                });
            });
          }
        });
        return myFuture.wait();
    },
    "deleteNetwork": function(id) {

        debug("deleteNetwork | ", id);

        function kubeCallback(err, res) {
            if(err) {
                console.log(err);
            }
        }

        var myFuture = new Future();
        var network = Networks.find({
            instanceId: id
        }).fetch()[0];
        const locationCode = network.locationCode;

        Networks.update({
          instanceId: id
        }, {
          $set: {
            active: false,
            deletedAt: new Date().getTime()
          }
        });

        NetworkFunctions.cleanNetworkDependencies(id);

        try{
          HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/deployments/` + id, kubeCallback);
          HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + id, kubeCallback);
          HTTP.call("GET", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets?labelSelector=app%3D` + encodeURIComponent("dynamo-node-" + id), function(err, response) {
              if(err) return console.log(err);
              HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets/` + JSON.parse(response.content).items[0].metadata.name, () => {
                HTTP.call("GET", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3D` + encodeURIComponent("dynamo-node-" + id), function(err, response) {
                  if(err) return console.log(err);
                  HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods/` + JSON.parse(response.content).items[0].metadata.name, function(err, res) {
                    HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/persistentvolumeclaims/` + `${id}-pvc`, function(error, response) {});
                  });
              });
            });
          });



          HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets/` + "basic-auth-" + id, kubeCallback);
          HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses/` + "ingress-" + id, kubeCallback);
        }catch(err){
          console.log("Kube delete error ", err);
        }
        Orders.remove({
            instanceId: id
        });
        SoloAssets.remove({
            instanceId: id
        });
        StreamsItems.remove({
            instanceId: id
        });
        AssetTypes.remove({
            instanceId: id
        })
        Secrets.remove({
            instanceId: id
        });

        BCAccounts.remove({
            instanceId: id
        })

        myFuture.return();


        return myFuture.wait();
    },
    "joinNetwork": function(networkName, nodeType, genesisFileContent, totalENodes, impulseURL, assetsContractAddress, atomicSwapContractAddress, streamsContractAddress, locationCode, networkConfig, userId) {
        debug("joinNetwork | Arguments", arguments);
        var myFuture = new Future();
        var instanceId = helpers.instanceIDGenerate();


        // const microNodes = Networks.find({
        //   user: Meteor.userId(),
        //   active: true,
        //   "networkConfig.cpu": 500
        // }).fetch();

        // const isMicro = networkConfig && ((networkConfig.config && networkConfig.config.cpu === 0.5) || (networkConfig.voucher && networkConfig.voucher.cpu === 0.5));
        // if(microNodes.length > 2 && isMicro) {
        //   throw new Meteor.Error('Can have maximum of 2 micro nodes only');
        // }

        locationCode = locationCode || "us-west-2";

        function deleteNetwork(id) {
            Networks.update({
              _id: id
            }, {
              $set: {
                active: false,
                deletedAt: new Date().getTime()
              }
            });
            NetworkFunctions.cleanNetworkDependencies(id);
            HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/deployments/` + instanceId, function(error, response) {});
            HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + instanceId, function(error, response) {});
            HTTP.call("GET", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets?labelSelector=app%3D` + encodeURIComponent("dynamo-node-" + instanceId), function(error, response) {
                if (!error) {
                    if (JSON.parse(response.content).items.length > 0) {
                        HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets/` + JSON.parse(response.content).items[0].metadata.name, function(error, response) {
                            HTTP.call("GET", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3D` + encodeURIComponent("dynamo-node-" + instanceId), function(error, response) {
                                if (!error) {
                                    if (JSON.parse(response.content).items.length > 0) {
                                        HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods/` + JSON.parse(response.content).items[0].metadata.name, function(error, response) {
                                          HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/persistentvolumeclaims/` + `${instanceId}-pvc`, function(error, response) {});
                                          HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets/` + "basic-auth-" + instanceId, function(error, response) {})
                                            HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses/` + "ingress-" + instanceId, function(error, response) {})
                                            BCAccounts.remove({
                                                instanceId: id
                                            })
                                        })
                                    }
                                }
                            })
                        })
                    }
                }
            });


        }
        const nodeConfig = getNodeConfig(networkConfig);

        if(!nodeConfig.cpu) {
          throw new Meteor.Error("Invalid Network Configuration");
        }

        const resourceConfig = getContainerResourceLimits({cpu: nodeConfig.cpu, ram: nodeConfig.ram});

        Networks.insert({
            "instanceId": instanceId,
            "name": networkName,
            "type": "join",
            "peerType": nodeType,
            "workerNodeIP": Config.workerNodeIP(locationCode),
            "user": userId ? userId : this.userId,
            "createdOn": Date.now(),
            "totalENodes": totalENodes,
            "genesisBlock": genesisFileContent,
            "locationCode": locationCode,
            voucherId: nodeConfig.voucherId,
            networkConfigId: nodeConfig.configId,
            metadata: {
              voucher: nodeConfig.voucher,
              networkConfig: nodeConfig.networkConfig
            },
            networkConfig: {cpu: nodeConfig.cpu, ram: nodeConfig.ram, disk: nodeConfig.disk},
            "impulseURL": impulseURL
        }, function(error, id) {
            if (error) {
                console.log(error);
                myFuture.throw("An unknown error occured");
            } else {
                totalENodes = JSON.stringify(totalENodes).replace(/\"/g, '\\"').replace(/\"/g, '\\"').replace(/\"/g, '\\"')
                genesisFileContent = jsonminify(genesisFileContent.toString()).replace(/\"/g, '\\"')

                if (nodeType === "authority") {
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
    spec:
      containers:
      - name: dynamo
        image: 402432300121.dkr.ecr.us-west-2.amazonaws.com/dynamo:${process.env.NODE_ENV || "dev"}
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
        - name: IMPULSE_URL
          value: ${impulseURL}
        resources:
          requests:
            memory: "${nodeConfig.ram}Gi"
            cpu: "${nodeConfig.cpu}m"
          limits:
            memory: "${nodeConfig.ram}Gi"
            cpu: "${nodeConfig.cpu}m"
      volumes:
        - name: dynamo-dir
          persistentVolumeClaim:
            claimName: ${instanceId}-pvc
      imagePullSecrets:
      - name: regsecret`
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
    spec:
      containers:
      - name: dynamo
        image: 402432300121.dkr.ecr.us-west-2.amazonaws.com/dynamo:${process.env.NODE_ENV || "dev"}
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
        - name: IMPULSE_URL
          value: ${impulseURL}
        resources:
          requests:
            memory: "${nodeConfig.ram}Gi"
            cpu: "${nodeConfig.cpu}m"
          limits:
            memory: "${nodeConfig.ram}Gi"
            cpu: "${nodeConfig.cpu}m"
      volumes:
        - name: dynamo-dir
          persistentVolumeClaim:
            claimName: ${instanceId}-pvc
      imagePullSecrets:
      - name: regsecret`;
                }
                HTTP.call("POST", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/persistentvolumeclaims`, {
                  content: JSON.stringify({
                    apiVersion: "v1",
                    kind: "PersistentVolumeClaim",
                    metadata: {
                      name: `${instanceId}-pvc`
                    },
                    spec:{
                      accessModes: [
                        "ReadWriteOnce"
                      ],
                      resources: {
                        requests: {
                          storage: `${nodeConfig.disk}Gi`
                        }
                      },
                      storageClassName: "gp2-storage-class"
                    }
                  }),
                  headers: {
                    "Content-Type": "application/yaml"
                  }
                });

                HTTP.call("POST", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta1/namespaces/${Config.namespace}/deployments`, {
                    "content": content,
                    "headers": {
                        "Content-Type": "application/yaml"
                    }
                }, function(error, response) {
                    if (error) {
                        console.log(error);
                        deleteNetwork(id)
                    } else {
                        HTTP.call("POST", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services`, {
                            "content": JSON.stringify({
                                "kind":"Service",
                                "apiVersion":"v1",
                                "metadata":{
                                    "name": instanceId
                                },
                                "spec":{
                                    "ports":[
                                        {
                                            "name":"rpc",
                                            "port":8545
                                        },
                                        {
                                            "name":"eth",
                                            "port":23000
                                        },
                                        {
                                            "name":"apis",
                                            "port":6382
                                        }
                                    ],
                                    "selector":{
                                        "app":"dynamo-node-" + instanceId
                                    },
                                    "type":"NodePort"
                                }
                            }),
                            "headers": {
                                "Content-Type": "application/json"
                            }
                        }, function(error, response) {
                            if (error) {
                                console.log(error);
                                deleteNetwork(id)
                            } else {

                                HTTP.call("GET", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + instanceId, {}, function(error, response) {
                                    if (error) {
                                        console.log(error);
                                        deleteNetwork(id)
                                    } else {
                                        let rpcNodePort = response.data.spec.ports[0].nodePort
                                        Networks.update({
                                            _id: id
                                        }, {
                                            $set: {
                                                rpcNodePort: response.data.spec.ports[0].nodePort,
                                                ethNodePort: response.data.spec.ports[1].nodePort,
                                                apisPort: response.data.spec.ports[2].nodePort,
                                                clusterIP: response.data.spec.clusterIP,
                                                realRPCNodePort: 8545,
                                                realEthNodePort: 23000,
                                                realAPIsPort: 6382
                                            }
                                        })

                                        let encryptedPassword = md5(instanceId);
                                        let auth = base64.encode(utf8.encode(instanceId + ":" + encryptedPassword))
                                        HTTP.call("POST", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets`, {
                                            "content": JSON.stringify({
                                                "apiVersion": "v1",
                                                "data": {
                                                    "auth": auth
                                                },
                                                "kind": "Secret",
                                                "metadata": {
                                                    "name": "basic-auth-" + instanceId,
                                                    "namespace": Config.namespace
                                                },
                                                "type": "Opaque"
                                            }),
                                            "headers": {
                                                "Content-Type": "application/json"
                                            }
                                        }, function(error) {
                                            if (error) {
                                                console.log(error);
                                                deleteNetwork(id)
                                            } else {
                                                HTTP.call("POST", `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses`, {
                                                        "content": JSON.stringify({
                                                            "apiVersion": "extensions/v1beta1",
                                                            "kind": "Ingress",
                                                            "metadata": {
                                                                "name": "ingress-" + instanceId,
                                                                "annotations": {
                                                                    "nginx.ingress.kubernetes.io/rewrite-target": "/",
                                                                    "nginx.ingress.kubernetes.io/auth-type": "basic",
                                                                    "nginx.ingress.kubernetes.io/auth-secret": "basic-auth-" + instanceId,
                                                                    "nginx.ingress.kubernetes.io/auth-realm": "Authentication Required",
                                                                    "nginx.ingress.kubernetes.io/enable-cors": "true",
                                                                    "nginx.ingress.kubernetes.io/cors-credentials": "true",
                                                                    "kubernetes.io/ingress.class": "nginx",
                                                                    "nginx.ingress.kubernetes.io/configuration-snippet": `if ($http_origin ~* (^https?://([^/]+\\.)*(localhost:3000|${Config.workerNodeDomainName()}))) {\n    set $cors \"true\";\n}\n# Nginx doesn't support nested If statements. This is where things get slightly nasty.\n# Determine the HTTP request method used\nif ($request_method = 'OPTIONS') {\n    set $cors \"\${cors}options\";\n}\nif ($request_method = 'GET') {\n    set $cors \"\${cors}get\";\n}\nif ($request_method = 'POST') {\n    set $cors \"\${cors}post\";\n}\n\nif ($cors = \"true\") {\n    # Catch all incase there's a request method we're not dealing with properly\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n}\n\nif ($cors = \"trueoptions\") {\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n\n    #\n    # Om nom nom cookies\n    #\n    add_header 'Access-Control-Allow-Credentials' 'true';\n    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';\n\n    #\n    # Custom headers and headers various browsers *should* be OK with but aren't\n    #\n    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';\n\n    #\n    # Tell client that this pre-flight info is valid for 20 days\n    #\n    add_header 'Access-Control-Max-Age' 1728000;\n    add_header 'Content-Type' 'text/plain charset=UTF-8';\n    add_header 'Content-Length' 0;\n    return 204;\n}`
                                                                }
                                                            },
                                                            "spec": {
                                                                "tls": [
                                                                    {
                                                                        "hosts": [
                                                                            Config.workerNodeDomainName(locationCode)
                                                                        ],
                                                                        "secretName": "blockcluster-ssl"
                                                                    }
                                                                ],
                                                                "rules": [{
                                                                    "host": Config.workerNodeDomainName(locationCode),
                                                                    "http": {
                                                                        "paths": [{
                                                                            "path": "/api/node/" + instanceId + "/jsonrpc",
                                                                            "backend": {
                                                                                "serviceName": instanceId,
                                                                                "servicePort": 8545
                                                                            }
                                                                        }, {
                                                                            "path": "/api/node/" + instanceId,
                                                                            "backend": {
                                                                                "serviceName": instanceId,
                                                                                "servicePort": 6382
                                                                            }
                                                                        }]
                                                                    }
                                                                }]
                                                            }
                                                        }),
                                                        "headers": {
                                                            "Content-Type": "application/json"
                                                        }
                                                    },
                                                    function(error) {
                                                        if (error) {
                                                            console.log(error);
                                                            deleteNetwork(id)
                                                        } else {
                                                            Networks.update({
                                                                _id: id
                                                            }, {
                                                                $set: {
                                                                    "api-password": instanceId
                                                                }
                                                            })
                                                            myFuture.return(id);
                                                        }
                                                    })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                });
            }
        })

        return myFuture.wait();
    },
    "vote": function(networkId, toVote) {
        var myFuture = new Future();
        var network = Networks.find({
            _id: networkId
        }).fetch()[0];


        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/utility/vote`, {
            "content": JSON.stringify({
                toVote: toVote
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "unVote": function(networkId, toUnvote) {
        var myFuture = new Future();
        var network = Networks.find({
            _id: networkId
        }).fetch()[0];
        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/utility/unVote`, {
            "content": JSON.stringify({
                toUnvote: toUnvote
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "createAccount": function(name, password, networkId) {
        var myFuture = new Future();
        var network = Networks.find({
            _id: networkId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/utility/createAccount`, {
            "content": JSON.stringify({
                name: name,
                password: password
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                console.log(typeof response.content)
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "inviteUserToNetwork": async function(networkId, nodeType, email, userId) {
        return UserFunctions.inviteUserToNetwork(networkId, nodeType, email, userId || this.userId);
        // let user = Accounts.findUserByEmail(email);
        // var network = Networks.find({
        //     instanceId: networkId
        // }).fetch()[0];
        // if (user) {
        //     Meteor.call(
        //         "joinNetwork",
        //         network.name,
        //         nodeType,
        //         network.genesisBlock.toString(), ["enode://" + network.nodeId + "@" + network.clusterIP + ":" + network.realEthNodePort].concat(network.totalENodes), [network.clusterIP + ":" + network.realConstellationNodePort].concat(network.totalConstellationNodes),
        //         network.assetsContractAddress,
        //         network.atomicSwapContractAddress,
        //         network.streamsContractAddress,
        //         (userId ? userId : user._id),
        //         network.locationCode
        //     )
        // } else {
        //     throw new Meteor.Error(500, 'Unknown error occured');
        // }
    },
    "createAssetType": function(instanceId, assetName, assetType, assetIssuer, reissuable, parts) {
        this.unblock();
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/createAssetType`, {
            "content": JSON.stringify({
                assetName: assetName,
                assetType: assetType,
                assetIssuer: assetIssuer,
                reissuable: reissuable,
                parts: parts
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "issueBulkAssets": function(networkId, assetName, fromAddress, toAddress, units) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: networkId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/issueBulkAsset`, {
            "content": JSON.stringify({
                fromAccount: fromAddress,
                assetName: assetName,
                toAccount: toAddress,
                units: units
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "issueSoloAsset": function(instanceId, assetName, fromAddress, toAddress, identifier) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/issueSoloAsset`, {
            "content": JSON.stringify({
                assetName: assetName,
                toAccount: toAddress,
                identifier: identifier,
                data: {},
                fromAccount: fromAddress
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "transferBulkAssets": function(instanceId, assetName, fromAddress, toAddress, units) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];


        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/transferBulkAsset`, {
            "content": JSON.stringify({
                fromAccount: fromAddress,
                toAccount: toAddress,
                assetName: assetName,
                units: units
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "transferSoloAsset": function(instanceId, assetName, fromAddress, toAddress, identifier) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/transferSoloAsset`, {
            "content": JSON.stringify({
                fromAccount: fromAddress,
                toAccount: toAddress,
                assetName: assetName,
                identifier: identifier
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "getBulkAssetBalance": function(instanceId, assetName, address) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/getBulkAssetBalance`, {
            "content": JSON.stringify({
                assetName: assetName,
                account: address
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return(responseBody.units.toString());
                }
            }
        })

        return myFuture.wait();
    },
    "getSoloAssetInfo": function(instanceId, assetName, identifier) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/getSoloAssetInfo`, {
            "content": JSON.stringify({
                assetName: assetName,
                identifier: identifier
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                console.log(response)
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return(responseBody);
                }
            }
        })

        return myFuture.wait();
    },
    "addUpdateSoloAssetInfo": function(instanceId, assetName, fromAddress, identifier, key, value, visibility) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];
        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/updateAssetInfo`, {
            "content": JSON.stringify({
                visibility: visibility,
                key: key,
                value: value,
                assetName: assetName,
                identifier: identifier,
                fromAccount: fromAddress
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "grantAccess": function(instanceId, assetName, identifier, publicKey, fromAddress) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/grantAccessToPrivateData`, {
            "content": JSON.stringify({
                assetName: assetName,
                identifier: identifier,
                publicKey: publicKey,
                fromAccount: fromAddress
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "revokeAccess": function(instanceId, assetName, identifier, publicKey, fromAddress) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/revokeAccessToPrivateData`, {
            "content": JSON.stringify({
                assetName: assetName,
                identifier: identifier,
                publicKey: publicKey,
                fromAccount: fromAddress
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "closeAsset": function(instanceId, assetName, fromAddress, identifier) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/closeAsset`, {
            "content": JSON.stringify({
                fromAccount: fromAddress,
                identifier: identifier,
                assetName: assetName
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "placeOrder": function(
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
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/placeOrder`, {
            "content": JSON.stringify({
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
                fromAddress: fromAddress,
                toAddress: toAddress
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "fullfillOrder": function(
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
        hash) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/fulfillOrder`, {
            "content": JSON.stringify({
                orderId: hash,
                toNetworkId: buyerInstanceId
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                console.log(response)
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "claimOrder": function(instanceId, atomicSwapHash, fromAddress, toAssetType, toAssetName, toAssetId, toAssetUnits) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/fulfillOrder`, {
            "content": JSON.stringify({
                orderId: atomicSwapHash,
                toNetworkId: instanceId
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                console.log(response)
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "cancelOrder": function(instanceId, orderId, fromAddress) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));
        var assetsContract = web3.eth.contract(smartContracts.assets.abi);
        var assets = assetsContract.at(network.assetsContractAddress);
        var atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
        var atomicSwap = atomicSwapContract.at(network.atomicSwapContractAddress);

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/cancelOrder`, {
            "content": JSON.stringify({
                orderId: orderId
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "searchSoloAssets": function(instanceId, query) {
        query = JSON.parse(query)
        query.instanceId = instanceId;
        return SoloAssets.find(query).fetch();
    },
    "rpcPasswordUpdate": function(instanceId, password, locationCode="us-west-2") {
        var myFuture = new Future();
        HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets/` + "basic-auth-" + instanceId, function(error, response) {
            if (error) {
                console.log(error);
                myFuture.throw("An unknown error occured while deleting secret");
            } else {
                let encryptedPassword = md5(password);
                let auth = base64.encode(utf8.encode(instanceId + ":" + password))
                HTTP.call("POST", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets`, {
                    "content": JSON.stringify({
                        "apiVersion": "v1",
                        "data": {
                            "auth": auth
                        },
                        "kind": "Secret",
                        "metadata": {
                            "name": "basic-auth-" + instanceId
                        },
                        "type": "Opaque"
                    }),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }, function(error) {
                    if (error) {
                        console.log(error);
                        myFuture.throw("An unknown error occured while creating secret");
                    } else {
                        Networks.update({
                            instanceId: instanceId
                        }, {
                            $set: {
                                "apis-password": password
                            }
                        })

                        myFuture.return();
                    }
                })
            }
        })

        return myFuture.wait();
    },
    "addPeer": function(instanceId, eNodeURL) {
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0]

        var myFuture = new Future();

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/utility/addPeer`, {
            "content": JSON.stringify({
                url: eNodeURL
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "createStream": function(instanceId, name, issuer) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/assets/createStream`, {
            "content": JSON.stringify({
                streamName: name,
                fromAccount: issuer
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                let responseBody = JSON.parse(response.content);
                if(responseBody.error) {
                    myFuture.throw(responseBody.error);
                } else {
                    myFuture.return();
                }
            }
        })

        return myFuture.wait();
    },
    "publishStream": function(instanceId, name, issuer, key, data, visibility, publicKeys) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/streams/publish`, {
            "content": JSON.stringify({
                visibility: visibility,
                fromAccount: issuer,
                streamName: name,
                key: key,
                data: data,
                publicKeys: publicKeys.split(",")
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                console.log(response)
                myFuture.return();
            }
        })

        return myFuture.wait();
    },
    "grantAccessStream": function(instanceId, name, address, from) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/streams/grantAccessToPublish`, {
            "content": JSON.stringify({
                streamName: name,
                publisher: address,
                fromAccount: from
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                console.log(response)
                myFuture.return();
            }
        })

        return myFuture.wait();
    },
    "revokeAccessStream": function(instanceId, name, address, from) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/streams/revokeAccessToPublish`, {
            "content": JSON.stringify({
                streamName: name,
                publisher: address,
                fromAccount: from
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if(error) {
                myFuture.throw(error);
            } else {
                console.log(response)
                myFuture.return();
            }
        })

        return myFuture.wait();
    },
    "updateAssetTypeCreatedNotifyURL": function(instanceId, url) {
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        var notificationURLs = network.notificationURLs || {};
        notificationURLs.assetTypeCreated = url;

        Networks.update({
            instanceId: instanceId
        }, {
            $set: {
                notificationURLs: notificationURLs
            }
        })
    },
    "downloadAccount": function(instanceId, accountAddress) {
        var myFuture = new Future();

        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        var account = BCAccounts.find({
            instanceId: instanceId,
            address: accountAddress
        }).fetch()[0]

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/utility/getPrivateKey`, {
            "content": JSON.stringify({
                address: accountAddress,
                password: account.password
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }, function(error, response) {
            if (error) {
                myFuture.throw("An unknown error occured");
            } else {
                myFuture.return(response.content);
            }
        })
        return myFuture.wait();
    },
    "downloadReport": function(instanceId, assetName, uID) {
        return SoloAssetAudit.find({
            instanceId: instanceId,
            assetName: assetName,
            uniqueIdentifier: uID,

        }, {sort: {date_created: 1}}).fetch()
    },
    "updateNodeCallbackURL": function(instanceId, callbackURL) {
        Networks.update({
            instanceId: instanceId
        }, {
            $set: {
                callbackURL: callbackURL
            }
        })
    },
    "updateNetworksCallbackURL": function(callbackURL) {
        console.log(this.userId, callbackURL)
        Meteor.users.update({ _id: this.userId }, {
			$set:{
				"profile.notifyURL": callbackURL
			}
		});
    }
})

Meteor.startup(()=>{
    serverStartup();
});

const LOCK_FILE_PATH = '/tmp/webapp.lock';
function serverStartup(){
    Migrations.migrateTo(6);
    fs.writeFileSync(LOCK_FILE_PATH, `Server started at  ${new Date()}`)
}

function serverStop(){

    try{
        if(fs.existsSync(LOCK_FILE_PATH)){
            // fs.unlinkSync(LOCK_FILE_PATH);
        }
    }catch(err){
        console.log(err);
    }
}

process.on('exit', () => {
    console.log("Exiting");
    serverStop();
});

process.on('uncaughtException', (e) => {
    console.log("Uncaught exception", e);
    serverStop();
})
