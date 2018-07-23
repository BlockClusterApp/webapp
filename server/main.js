require("../imports/startup/server/")
require('../imports/api/emails/email-validator')
require('../imports/api/emails/forgot-password')
require('../imports/api/locations');

import UserFunctions from '../imports/api/server-functions/user-functions';
import {
    Networks
} from "../imports/collections/networks/networks.js"
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

Meteor.methods({
    "createNetwork": function(networkName,  locationCode, userId) {
        var myFuture = new Future();
        var instanceId = helpers.instanceIDGenerate();

        if(!locationCode){
            locationCode = "us-west-2";
        }

        function deleteNetwork(id) {
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
            })

            Networks.remove({
                _id: id
            });
        }

        Networks.insert({
            "instanceId": instanceId,
            "name": networkName,
            "type": "new",
            "peerType": "authority",
            "workerNodeIP": Config.workerNodeIP(locationCode),
            "user": userId ? userId : this.userId,
            "createdOn": Date.now(),
            "totalENodes": [],
            "totalConstellationNodes": [],
            "locationCode": locationCode
        }, (error, id) => {
            if (error) {
                console.log(error);
                myFuture.throw("An unknown error occured");
            } else {
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
                                            "name":"dynamo",
                                            "image":"402432300121.dkr.ecr.us-west-2.amazonaws.com/dynamo-test",
                                            "command":[
                                                "bin/bash",
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
                                            "lifecycle": {
                                                "postStart": {
                                                    "exec": {
                                                        "command": [
                                                            "bin/bash",
                                                            "-c",
                                                            "node ./apis/postStart.js"
                                                        ]
                                                    }
                                                },
                                                "preStop": {
                                                    "exec": {
                                                        "command": [
                                                            "bin/bash",
                                                            "-c",
                                                            "node ./apis/preStop.js"
                                                        ]
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            "name":"impulse",
                                            "image":"402432300121.dkr.ecr.us-west-2.amazonaws.com/impulse",
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
                                            "name":"constellation",
                                            "port":9001
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
                                                constellationNodePort: response.data.spec.ports[1].nodePort,
                                                ethNodePort: response.data.spec.ports[2].nodePort,
                                                apisPort: response.data.spec.ports[3].nodePort,
                                                impulsePort: response.data.spec.ports[4].nodePort,
                                                clusterIP: response.data.spec.clusterIP,
                                                realRPCNodePort: 8545,
                                                realConstellationNodePort: 9001,
                                                realEthNodePort: 23000,
                                                realAPIsPort: 6382,
                                                realImpulsePort: 7558,
                                                impulseURL: "http://" + Config.workerNodeIP(locationCode) + ":" + response.data.spec.ports[4].nodePort
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
                                                                    "ingress.kubernetes.io/auth-type": "basic",
                                                                    "ingress.kubernetes.io/auth-secret": "basic-auth-" + instanceId,
                                                                    "ingress.kubernetes.io/auth-realm": "Authentication Required",
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
            }
        })

        return myFuture.wait();
    },
    "deleteNetwork": function(id) {

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
        HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/deployments/` + id, function(error, response) {
            if (error) {
                console.log(error);
                myFuture.throw("An unknown error occured");
            } else {
                HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/services/` + id, function(error, response) {
                    if (error) {
                        console.log(error);
                        myFuture.throw("An unknown error occured");
                    } else {
                        HTTP.call("GET", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets?labelSelector=app%3D` + encodeURIComponent("dynamo-node-" + id), function(error, response) {
                            if (error) {
                                console.log(error);
                                myFuture.throw("An unknown error occured");
                            } else {
                                HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/replicasets/` + JSON.parse(response.content).items[0].metadata.name, function(error, response) {
                                    if (error) {
                                        console.log(error);
                                        myFuture.throw("An unknown error occured");
                                    } else {
                                        HTTP.call("GET", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3D` + encodeURIComponent("dynamo-node-" + id), function(error, response) {
                                            if (error) {
                                                console.log(error);
                                                myFuture.throw("An unknown error occured");
                                            } else {
                                                HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/pods/` + JSON.parse(response.content).items[0].metadata.name, function(error, response) {
                                                    if (error) {
                                                        console.log(error);
                                                        myFuture.throw("An unknown error occured");
                                                    } else {
                                                        HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/api/v1/namespaces/${Config.namespace}/secrets/` + "basic-auth-" + id, function(error, response) {
                                                            if (error) {
                                                                console.log(error);
                                                                myFuture.throw("An unknown error occured while deleting secrets");
                                                            } else {
                                                                HTTP.call("DELETE", `${Config.kubeRestApiHost(locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses/` + "ingress-" + id, function(error, response) {
                                                                    if (error) {
                                                                        console.log(error);
                                                                        myFuture.throw("An unknown error occured while deleting ingresses");
                                                                    } else {
                                                                        Networks.remove({
                                                                            instanceId: id
                                                                        });
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

                                                                        EncryptionKeys.remove({
                                                                            instanceId: id
                                                                        })

                                                                        DerivationKeys.remove({
                                                                            instanceId: id
                                                                        })

                                                                        EncryptedObjects.remove({
                                                                            instanceId: id
                                                                        })

                                                                        SoloAssetAudit.remove({
                                                                            instanceId: id
                                                                        })

                                                                        myFuture.return();
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })

        return myFuture.wait();
    },
    "joinNetwork": function(networkName, nodeType, genesisFileContent, totalENodes, totalConstellationNodes, impulseURL, assetsContractAddress, atomicSwapContractAddress, streamsContractAddress, locationCode, userId) {
        var myFuture = new Future();
        var instanceId = helpers.instanceIDGenerate();


        locationCode = locationCode || "us-west-2";

        function deleteNetwork(id) {
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
            })
            Networks.remove({
                _id: id
            });
        }

        Networks.insert({
            "instanceId": instanceId,
            "name": networkName,
            "type": "join",
            "peerType": nodeType,
            "workerNodeIP": Config.workerNodeIP(locationCode),
            "user": userId ? userId : this.userId,
            "createdOn": Date.now(),
            "totalENodes": totalENodes,
            "totalConstellationNodes": totalConstellationNodes,
            "genesisBlock": genesisFileContent,
            "locationCode": locationCode,
            "impulseURL": impulseURL
        }, function(error, id) {
            if (error) {
                console.log(error);
                myFuture.throw("An unknown error occured");
            } else {
                totalConstellationNodes = JSON.stringify(totalConstellationNodes).replace(/\"/g, '\\"').replace(/\"/g, '\\"').replace(/\"/g, '\\"')
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
        image: 402432300121.dkr.ecr.us-west-2.amazonaws.com/dynamo-test
        command: [ "bin/bash", "-c", "./setup.sh ${totalConstellationNodes} ${totalENodes} '${genesisFileContent}'  mine" ]
        lifecycle:
          postStart:
            exec:
              command: ["bin/bash", "-c", "node ./apis/postStart.js"]
          preStop:
            exec:
              command: ["bin/bash", "-c", "node ./apis/preStop.js"]
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
        image: 402432300121.dkr.ecr.us-west-2.amazonaws.com/dynamo-test
        command: [ "bin/bash", "-c", "./setup.sh ${totalConstellationNodes} ${totalENodes} '${genesisFileContent}'" ]
        lifecycle:
          postStart:
            exec:
              command: ["bin/bash", "-c", "node ./apis/postStart.js"]
          preStop:
            exec:
              command: ["bin/bash", "-c", "node ./apis/preStop.js"]
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
      imagePullSecrets:
      - name: regsecret`;
                }

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
                                            "name":"constellation",
                                            "port":9001
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
                                                constellationNodePort: response.data.spec.ports[1].nodePort,
                                                ethNodePort: response.data.spec.ports[2].nodePort,
                                                apisPort: response.data.spec.ports[3].nodePort,
                                                clusterIP: response.data.spec.clusterIP,
                                                realRPCNodePort: 8545,
                                                realConstellationNodePort: 9001,
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
                                                                    "ingress.kubernetes.io/auth-type": "basic",
                                                                    "ingress.kubernetes.io/auth-secret": "basic-auth-" + instanceId,
                                                                    "ingress.kubernetes.io/auth-realm": "Authentication Required",
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
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));
        web3.currentProvider.sendAsync({
            method: "istanbul_propose",
            params: [toVote, true],
            jsonrpc: "2.0",
            id: new Date().getTime()
        }, Meteor.bindEnvironment(function(error, result) {
            if (error) {
                console.log(error);
                myFuture.throw("An unknown error occured");
            } else {
                myFuture.return();
            }
        }))

        return myFuture.wait();
    },
    "unVote": function(networkId, toVote) {
        var myFuture = new Future();
        var network = Networks.find({
            _id: networkId
        }).fetch()[0];
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));
        web3.currentProvider.sendAsync({
            method: "istanbul_propose",
            params: [toVote, false],
            jsonrpc: "2.0",
            id: new Date().getTime()
        }, Meteor.bindEnvironment(function(error, result) {
            if (error) {
                console.log(error);
                myFuture.throw("An unknown error occured");
            } else {
                myFuture.return();
            }
        }))

        return myFuture.wait();
    },
    "createAccount": function(password, networkId) {
        var myFuture = new Future();
        var network = Networks.find({
            _id: networkId
        }).fetch()[0];

        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));

        web3.currentProvider.sendAsync({
            method: "personal_newAccount",
            params: [password],
            jsonrpc: "2.0",
            id: new Date().getTime()
        }, Meteor.bindEnvironment(function(error, result) {
            if (error) {
                console.log(error);
                myFuture.throw("An unknown error occured");
            } else {
                web3.currentProvider.sendAsync({
                    method: "personal_unlockAccount",
                    params: [result.result, password, 0],
                    jsonrpc: "2.0",
                    id: new Date().getTime()
                }, Meteor.bindEnvironment(function(error) {
                    if(!error) {
                        BCAccounts.insert({
                            "instanceId": network.instanceId,
                            "address": result.result,
                            "password": password
                        }, Meteor.bindEnvironment((error) => {
                            if(!error) {
                                myFuture.return();
                            } else {
                                myFuture.throw("An unknown error occured");
                            }
                        }))
                    } else {
                        myFuture.throw("An unknown error occured");
                    }
                }))
            }
        }))

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
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:${network.rpcNodePort}`));
        var assetsContract = web3.eth.contract(smartContracts.assets.abi);
        var assets = assetsContract.at(network.assetsContractAddress);
        if (assetType === "solo") {
            assets.createSoloAssetType.sendTransaction(assetName, {
                from: assetIssuer,
                gas: '99999999999999999'
            }, function(error, txnHash) {
                if (!error) {
                    myFuture.return();
                } else {
                    myFuture.throw("An unknown error occured");
                }
            })
        } else {
            assets.createBulkAssetType.sendTransaction(assetName, (reissuable === "true"), parts, {
                from: assetIssuer,
                gas: '99999999999999999'
            }, function(error, txnHash) {
                if (!error) {
                    myFuture.return();
                } else {
                    myFuture.throw("An unknown error occured");
                }
            })
        }

        return myFuture.wait();
    },
    "issueBulkAssets": function(networkId, assetName, fromAddress, toAddress, units) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: networkId
        }).fetch()[0];
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));
        var assetsContract = web3.eth.contract(smartContracts.assets.abi);
        var assets = assetsContract.at(network.assetsContractAddress);
        var parts = assets.getBulkAssetParts.call(assetName)
        units = (new BigNumber(units)).multipliedBy(helpers.addZeros(1, parts))
        assets.issueBulkAsset.sendTransaction(assetName, units.toString(), toAddress, {
            from: fromAddress,
        }, function(error, txnHash) {
            if (error) {
                myFuture.throw("An unknown error occured");
            } else {
                myFuture.return();
            }
        })

        return myFuture.wait();
    },
    "issueSoloAsset": function(instanceId, assetName, fromAddress, toAddress, identifier) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/api/node/${instanceId}/assets/issueSoloAsset`, {
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
                console.log(response)
                myFuture.return();
            }
        })

        return myFuture.wait();
    },
    "transferBulkAssets": function(instanceId, assetName, fromAddress, toAddress, units) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));
        var assetsContract = web3.eth.contract(smartContracts.assets.abi);
        var assets = assetsContract.at(network.assetsContractAddress);
        var parts = assets.getBulkAssetParts.call(assetName)
        units = (new BigNumber(units)).multipliedBy(helpers.addZeros(1, parts))
        assets.transferBulkAssetUnits.sendTransaction(assetName, toAddress, units.toString(), {
            from: fromAddress
        }, function(error, txnHash) {
            if (error) {
                myFuture.throw("An unknown error occured");
            } else {
                myFuture.return();
            }
        })
        return myFuture.wait();
    },
    "transferSoloAsset": function(instanceId, assetName, fromAddress, toAddress, identifier) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));
        var assetsContract = web3.eth.contract(smartContracts.assets.abi);
        var assets = assetsContract.at(network.assetsContractAddress);
        assets.transferOwnershipOfSoloAsset.sendTransaction(assetName, identifier, toAddress, {
            from: fromAddress
        }, function(error, txnHash) {
            if (error) {
                myFuture.throw("An unknown error occured");
            } else {
                myFuture.return();
            }
        })
        return myFuture.wait();
    },
    "getBulkAssetBalance": function(instanceId, assetName, address) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));
        var assetsContract = web3.eth.contract(smartContracts.assets.abi);
        var assets = assetsContract.at(network.assetsContractAddress);
        var parts = assets.getBulkAssetParts.call(assetName)
        assets.getBulkAssetUnits.call(assetName, address, {}, function(error, units) {
            if (error) {
                myFuture.throw("An unknown error occured");
            } else {
                units = (new BigNumber(units)).dividedBy(helpers.addZeros(1, parts)).toFixed(parseInt(parts))
                myFuture.return(units.toString());
            }
        })
        return myFuture.wait();
    },
    "getSoloAssetInfo": function(instanceId, assetName, identifier) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));
        var assetsContract = web3.eth.contract(smartContracts.assets.abi);
        var assets = assetsContract.at(network.assetsContractAddress);
        properties = []

        let addedOrUpdatedSoloAssetExtraData_events = assets.addedOrUpdatedSoloAssetExtraData({}, {
            fromBlock: 0,
            toBlock: "latest"
        })
        addedOrUpdatedSoloAssetExtraData_events.get((error, events) => {
            if (!error) {
                for (let count = 0; count < events.length; count++) {
                    properties.indexOf(events[count].args.key) === -1 ? properties.push(events[count].args.key) : null;
                }
                assets.isSoloAssetClosed.call(assetName, identifier, {}, function(error, isClosed) {
                    if (!error) {
                        assets.getSoloAssetOwner.call(assetName, identifier, {}, function(error, owner) {
                            if (!error) {
                                let extraData = {};

                                if (properties.length > 0) {
                                    for (let count = 0; count < properties.length; count++) {
                                        extraData[properties[count]] = assets.getSoloAssetExtraData.call(assetName, identifier, properties[count])
                                    }
                                }

                                myFuture.return({
                                    "details": {
                                        isClosed: isClosed,
                                        owner: owner,
                                        extraData: extraData
                                    }
                                });

                            } else {
                                myFuture.throw("An unknown error occured");
                            }
                        })
                    } else {
                        myFuture.throw("An unknown error occured");
                    }
                })
            } else {
                myFuture.throw("An unknown error occured");
            }
        })

        return myFuture.wait();
    },
    "addUpdateSoloAssetInfo": function(instanceId, assetName, fromAddress, identifier, key, value, visibility) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];
        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/api/node/${instanceId}/assets/updateAssetInfo`, {
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
                console.log(response)
                myFuture.return();
            }
        })

        return myFuture.wait();
    },
    "grantAccess": function(instanceId, assetName, identifier, publicKey, fromAddress) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/api/node/${instanceId}/assets/grantAccessToPrivateData`, {
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
                console.log(response)
                myFuture.return();
            }
        })

        return myFuture.wait();
    },
    "revokeAccess": function(instanceId, assetName, identifier, publicKey, fromAddress) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        HTTP.call("POST", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/api/node/${instanceId}/assets/revokeAccessToPrivateData`, {
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
                console.log(response)
                myFuture.return();
            }
        })

        return myFuture.wait();
    },
    "closeAsset": function(instanceId, assetName, fromAddress, identifier) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));
        var assetsContract = web3.eth.contract(smartContracts.assets.abi);
        var assets = assetsContract.at(network.assetsContractAddress);

        assets.closeSoloAsset.sendTransaction(assetName, identifier, {
            from: fromAddress,
            gas: '4712388'
        }, function(error, txnHash) {
            if (error) {
                myFuture.throw("An unknown error occured");
            } else {
                myFuture.return();
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
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));
        var atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
        var atomicSwap = atomicSwapContract.at(network.atomicSwapContractAddress);
        var assetsContract = web3.eth.contract(smartContracts.assets.abi);
        var assets = assetsContract.at(network.assetsContractAddress);

        var secret = helpers.generateSecret();

        atomicSwap.calculateHash.call(secret, Meteor.bindEnvironment((error, hash) => {
            if (!error) {
                Secrets.insert({
                    "instanceId": otherInstanceId,
                    "secret": secret,
                    "hash": hash,
                }, Meteor.bindEnvironment((error) => {
                    if (!error) {
                        assets.approve.sendTransaction(
                            fromType,
                            fromId,
                            fromUniqueIdentifier,
                            fromUnits,
                            network.atomicSwapContractAddress, {
                                from: fromAddress,
                                gas: '99999999999999999'
                            },
                            Meteor.bindEnvironment((error) => {
                                if (!error) {
                                    atomicSwap.lock.sendTransaction(
                                        toAddress,
                                        hash,
                                        lockMinutes,
                                        fromType,
                                        fromId,
                                        fromUniqueIdentifier,
                                        fromUnits,
                                        toType,
                                        toId,
                                        toUnits,
                                        toUniqueIdentifier,
                                        toGenesisBlockHash, {
                                            from: fromAddress,
                                            gas: '99999999999999999'
                                        },
                                        Meteor.bindEnvironment((error) => {
                                            if (!error) {
                                                myFuture.return();
                                            } else {
                                                myFuture.throw("An unknown error occured");
                                            }
                                        }))
                                } else {
                                    myFuture.throw("An unknown error occured");
                                }
                            })
                        )
                    } else {
                        myFuture.throw("An unknown error occured");
                    }
                }))
            } else {
                myFuture.throw("An unknown error occured");
            }
        }))

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
            instanceId: buyerInstanceId
        }).fetch()[0];
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));
        var atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
        var atomicSwap = atomicSwapContract.at(network.atomicSwapContractAddress);
        var assetsContract = web3.eth.contract(smartContracts.assets.abi);
        var assets = assetsContract.at(network.assetsContractAddress);

        AcceptedOrders.insert({
            "instanceId": instanceId,
            "buyerInstanceId": buyerInstanceId,
            "hash": hash
        }, Meteor.bindEnvironment((error) => {
            if (!error) {
                assets.approve.sendTransaction(
                    fromType,
                    fromId,
                    fromUniqueIdentifier,
                    fromUnits,
                    network.atomicSwapContractAddress, {
                        from: fromAddress,
                        gas: '99999999999999999'
                    },
                    Meteor.bindEnvironment((error) => {
                        if (!error) {
                            atomicSwap.lock.sendTransaction(
                                toAddress,
                                hash,
                                lockMinutes,
                                fromType,
                                fromId,
                                fromUniqueIdentifier,
                                fromUnits,
                                toType,
                                toId,
                                toUnits,
                                toUniqueIdentifier,
                                toGenesisBlockHash, {
                                    from: fromAddress,
                                    gas: '99999999999999999'
                                },
                                Meteor.bindEnvironment((error) => {
                                    if (!error) {
                                        myFuture.return();
                                    } else {
                                        myFuture.throw("An unknown error occured");
                                    }
                                }))
                        } else {
                            myFuture.throw("An unknown error occured");
                        }
                    })
                )
            } else {
                myFuture.throw("An unknown error occured");
            }
        }))

        return myFuture.wait();
    },
    "claimOrder": function(instanceId, atomicSwapHash, fromAddress, toAssetType, toAssetName, toAssetId, toAssetUnits) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));
        var atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
        var atomicSwap = atomicSwapContract.at(network.atomicSwapContractAddress);
        var assetsContract = web3.eth.contract(smartContracts.assets.abi);
        var assets = assetsContract.at(network.assetsContractAddress);

        assets.approve.sendTransaction(
            toAssetType,
            toAssetName,
            toAssetId,
            toAssetUnits,
            network.atomicSwapContractAddress, {
                from: fromAddress,
                gas: '99999999999999999'
            }, Meteor.bindEnvironment((error) => {
                if (!error) {
                    atomicSwap.claim.sendTransaction(
                        atomicSwapHash,
                        "", {
                            from: fromAddress,
                            gas: '99999999999999999'
                        }, Meteor.bindEnvironment(function(error, txHash) {
                            if (error) {
                                myFuture.throw("An unknown error occured");
                            } else {
                                myFuture.return();
                            }
                        }))
                } else {
                    myFuture.throw("An unknown error occured");
                }
            })
        )

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

        atomicSwap.unlock.sendTransaction(
            orderId, {
                from: fromAddress,
                gas: '99999999999999999'
            },
            function(error, txHash) {
                if (error) {
                    myFuture.throw("An unknown error occured");
                } else {
                    myFuture.return();
                }
            }
        )

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

        if (network.staticPeers == undefined) {
            network.staticPeers = [eNodeURL]
        } else {
            network.staticPeers.push(eNodeURL)
        }

        Networks.update({
            instanceId: instanceId
        }, {
            $set: {
                "staticPeers": network.staticPeers
            }
        })
    },
    "createStream": function(instanceId, name, issuer) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));

        var streamsContract = web3.eth.contract(smartContracts.streams.abi);
        var streams = streamsContract.at(network.streamsContractAddress);

        streams.createStream.sendTransaction(name, {
            from: issuer,
            gas: '99999999999999999'
        }, function(error, txnHash) {
            if (!error) {
                myFuture.return();
            } else {
                myFuture.throw("An unknown error occured");
            }
        })

        return myFuture.wait();
    },
    "publishStream": function(instanceId, name, issuer, key, data) {
        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];
        let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.workerNodeIP(network.locationCode)}:` + network.rpcNodePort));

        var streamsContract = web3.eth.contract(smartContracts.streams.abi);
        var streams = streamsContract.at(network.streamsContractAddress);

        streams.publish.sendTransaction(name, key, data, {
            from: issuer,
            gas: '99999999999999999'
        }, function(error, txnHash) {
            if (!error) {
                myFuture.return();
            } else {
                myFuture.throw("An unknown error occured");
            }
        })

        return myFuture.wait();
    },
    "subscribeStream": function(instanceId, name) {
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        Streams.update({
            instanceId: instanceId,
            streamName: name
        }, {
            $set: {
                subscribed: true
            }
        })
    },
    "unsubscribeStream": function(instanceId, name) {
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        Streams.update({
            instanceId: instanceId,
            streamName: name
        }, {
            $set: {
                subscribed: false
            }
        })
    },
    "subscribeAssetType": function(instanceId, name) {
        AssetTypes.update({
            instanceId: instanceId,
            assetName: name
        }, {
            $set: {
                subscribed: true
            }
        })
    },
    "unsubscribeAssetType": function(instanceId, name) {
        AssetTypes.update({
            instanceId: instanceId,
            assetName: name
        }, {
            $set: {
                subscribed: false
            }
        })
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

        HTTP.call("GET", `http://${Config.workerNodeIP(network.locationCode)}:${network.apisPort}/api/node/${instanceId}/utility/getPrivateKey?address=${accountAddress}&password=${account.password}`, function(error, response) {
            console.log(error, response)
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
    }
})

Meteor.startup(()=>{
    serverStartup();
});

const LOCK_FILE_PATH = '/tmp/webapp.lock';
function serverStartup(){
    fs.writeFileSync(LOCK_FILE_PATH, `Server started at ${new Date()}`)
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
