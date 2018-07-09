import HTTP from 'meteor/http';
require("../../imports/startup/server/")
import {
    Networks
} from "../../imports/collections/networks/networks.js"
import {
    Utilities
} from "../../imports/collections/utilities/utilities.js"
import {
    SoloAssets
} from "../../imports/collections/soloAssets/soloAssets.js"
import {
    StreamsItems
} from "../../imports/collections/streamsItems/streamsItems.js"
import {
    Streams
} from "../../imports/collections/streams/streams.js"
import {
    AssetTypes
} from "../../imports/collections/assetTypes/assetTypes.js"
import {
    Orders
} from "../../imports/collections/orders/orders.js"
import {
    Secrets
} from "../../imports/collections/secrets/secrets.js"
import {
    AcceptedOrders
} from "../../imports/collections/acceptedOrders/acceptedOrders.js"
import {
    BCAccounts
} from "../../imports/collections/bcAccounts/bcAccounts.js"

var Future = Npm.require("fibers/future");
var lightwallet = Npm.require("eth-lightwallet");
import Web3 from "web3";
var jsonminify = require("jsonminify");
import helpers from "../../imports/modules/helpers"
import server_helpers from "../../imports/modules/helpers/server"
import smartContracts from "../../imports/modules/smart-contracts"
import {
    scanBlocksOfNode,
    authoritiesListCronJob
} from "../../imports/collections/networks/server/cron.js"
var md5 = require("apache-md5");
var base64 = require('base-64');
var utf8 = require('utf8');
var BigNumber = require('bignumber.js');


function _deleteNetwork(id, instanceId) {
    HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/deployments/` + instanceId, function(error, response) {});
            HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services/` + instanceId, function(error, response) {});
            HTTP.call("GET", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/replicasets?labelSelector=app%3D` + encodeURIComponent("quorum-node-" + instanceId), function(error, response) {
                if (!error) {
                    if (JSON.parse(response.content).items.length > 0) {
                        HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/replicasets/` + JSON.parse(response.content).items[0].metadata.name, function(error, response) {
                            HTTP.call("GET", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/pods?labelSelector=app%3D` + encodeURIComponent("quorum-node-" + instanceId), function(error, response) {
                                if (!error) {
                                    if (JSON.parse(response.content).items.length > 0) {
                                        HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/pods/` + JSON.parse(response.content).items[0].metadata.name, function(error, response) {
                                            HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/secrets/` + "basic-auth-" + instanceId, function(error, response) {})
                                            HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/extensions/v1beta1/namespaces/default/ingresses/` + "ingress-" + instanceId, function(error, response) {})
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


function createNetwork(networkName){
    var myFuture = new Future();
        var kuberREST_IP = Utilities.find({
            "name": "kuberREST_IP"
        }).fetch()[0].value;
        var instanceId = helpers.instanceIDGenerate();

        Networks.insert({
            "instanceId": instanceId,
            "name": networkName,
            "type": "new",
            "status": "initializing",
            "peerType": "authority",
            "user": this.userId,
            "createdOn": Date.now(),
            "totalENodes": [],
            "totalConstellationNodes": []
        }, (error, id) => {
            if (error) {
                console.log(error);
                myFuture.throw("An unknown error occured");
            } else {
                HTTP.call("POST", `http://${kuberREST_IP}:8000/apis/apps/v1beta1/namespaces/default/deployments`, {
                    "content": JSON.stringify(Helper.YamlHelper.CreateNetwork.createQuoramAndScannerDeployment(instanceId)),
                    "headers": {...Helper.HeaderHelper.ContentTypeJson}
                }, function(error, response) {
                    if (error) {
                        console.log(error);
                        _deleteNetwork(id, instanceId)
                    } else {
                        HTTP.call("POST", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services`, {
                            "content": JSON.stringify(Helper.YamlHelper.CreateNetwork.createQuoramService(instanceId)),
                            "headers": {...Helper.HeaderHelper.ContentTypeJson}
                        }, (error, response) => {
                            if (error) {
                                console.log(error);
                                _deleteNetwork(id, instanceId)
                            } else {
                                HTTP.call("GET", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services/` + instanceId, {}, (error, response) => {
                                    if (error) {
                                        console.log(error);
                                        _deleteNetwork(id, instanceId)
                                    } else {
                                        let rpcNodePort = response.data.spec.ports[0].nodePort

                                        Networks.update({
                                            _id: id
                                        }, {
                                            $set: {
                                                rpcNodePort: response.data.spec.ports[0].nodePort,
                                                constellationNodePort: response.data.spec.ports[1].nodePort,
                                                ethNodePort: response.data.spec.ports[2].nodePort,
                                                utilityPort: response.data.spec.ports[3].nodePort,
                                                clusterIP: response.data.spec.clusterIP,
                                                realRPCNodePort: 8545,
                                                realConstellationNodePort: 9001,
                                                realEthNodePort: 23000,
                                                realUtilityPort: 6382
                                            }
                                        })

                                        let encryptedPassword = md5(instanceId);
                                        let auth = base64.encode(utf8.encode(instanceId + ":" + encryptedPassword))
                                        HTTP.call("POST", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/secrets`, {
                                            "content": JSON.stringify({
                                                "apiVersion": "v1",
                                                "data": {
                                                    "auth": auth
                                                },
                                                "kind": "Secret",
                                                "metadata": {
                                                    "name": "basic-auth-" + instanceId,
                                                    "namespace": "default"
                                                },
                                                "type": "Opaque"
                                            }),
                                            "headers": {
                                                "Content-Type": "application/json"
                                            }
                                        }, (error) => {
                                            if (error) {
                                                console.log(error);
                                                _deleteNetwork(id, instanceId)
                                            } else {
                                                HTTP.call("POST", `http://${kuberREST_IP}:8000/apis/extensions/v1beta1/namespaces/default/ingresses`, {
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
                                                                    "ingress.kubernetes.io/enable-cors": "true",
                                                                    "ingress.kubernetes.io/cors-credentials": "true",
                                                                    "kubernetes.io/ingress.class": "nginx",
                                                                    "ingress.kubernetes.io/configuration-snippet": "if ($http_origin ~* (^https?://([^/]+\\.)*(localhost:3000|app.blockcluster.io))) {\n    set $cors \"true\";\n}\n# Nginx doesn't support nested If statements. This is where things get slightly nasty.\n# Determine the HTTP request method used\nif ($request_method = 'OPTIONS') {\n    set $cors \"${cors}options\";\n}\nif ($request_method = 'GET') {\n    set $cors \"${cors}get\";\n}\nif ($request_method = 'POST') {\n    set $cors \"${cors}post\";\n}\n\nif ($cors = \"true\") {\n    # Catch all incase there's a request method we're not dealing with properly\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n}\n\nif ($cors = \"trueget\") {\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n    add_header 'Access-Control-Allow-Credentials' 'true';\n    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';\n    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';\n}\n\nif ($cors = \"trueoptions\") {\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n\n    #\n    # Om nom nom cookies\n    #\n    add_header 'Access-Control-Allow-Credentials' 'true';\n    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';\n\n    #\n    # Custom headers and headers various browsers *should* be OK with but aren't\n    #\n    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';\n\n    #\n    # Tell client that this pre-flight info is valid for 20 days\n    #\n    add_header 'Access-Control-Max-Age' 1728000;\n    add_header 'Content-Type' 'text/plain charset=UTF-8';\n    add_header 'Content-Length' 0;\n    return 204;\n}\n\nif ($cors = \"truepost\") {\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n    add_header 'Access-Control-Allow-Credentials' 'true';\n    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';\n    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';\n}"
                                                                }
                                                            },
                                                            "spec": {
                                                                "tls": [
                                                                    {
                                                                        "hosts": [
                                                                            "app.blockcluster.io"
                                                                        ],
                                                                        "secretName": "blockcluster-ssl"
                                                                    }
                                                                ],
                                                                "rules": [{
                                                                    "host": "app.blockcluster.io",
                                                                    "http": {
                                                                        "paths": [{
                                                                            "path": "/node/" + instanceId,
                                                                            "backend": {
                                                                                "serviceName": instanceId,
                                                                                "servicePort": 8545
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
                                                            _deleteNetwork(id, instanceId)
                                                        } else {
                                                            myFuture.return();

                                                            var workerNodeIP = Utilities.find({
                                                                "name": "workerNodeIP"
                                                            }).fetch()[0].value;

                                                            Meteor.setTimeout(() => {
                                                                HTTP.call("GET", `http://` + workerNodeIP + ":" + response.data.spec.ports[3].nodePort + "/nodeInfo", function(error, response) {
                                                                    if (error) {
                                                                        console.log(error);
                                                                        _deleteNetwork(id, instanceId)
                                                                    } else {
                                                                        var data = JSON.parse(response.content);
                                                                        Networks.update({
                                                                            _id: id
                                                                        }, {
                                                                            $set: {
                                                                                genesisBlock: data.genesis,
                                                                                nodeKey: data.nodekey,
                                                                                nodeEthAddress: "0x" + lightwallet.keystore._computeAddressFromPrivKey(data.nodekey),
                                                                                constellationPubKey: data.constellationPublicKey
                                                                            }
                                                                        })

                                                                        let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + rpcNodePort));
                                                                        web3.currentProvider.sendAsync({
                                                                            method: "admin_nodeInfo",
                                                                            params: [],
                                                                            jsonrpc: "2.0",
                                                                            id: new Date().getTime()
                                                                        }, Meteor.bindEnvironment((error, result) => {
                                                                            if (error) {
                                                                                console.log(error);
                                                                                _deleteNetwork(id, instanceId)
                                                                            } else {
                                                                                Networks.update({
                                                                                    _id: id
                                                                                }, {
                                                                                    $set: {
                                                                                        nodeId: result.result.id,
                                                                                    }
                                                                                })

                                                                                web3.currentProvider.sendAsync({
                                                                                    method: "istanbul_getValidators",
                                                                                    params: [],
                                                                                    jsonrpc: "2.0",
                                                                                    id: new Date().getTime()
                                                                                }, Meteor.bindEnvironment(function(error, result) {
                                                                                    if (error) {
                                                                                        console.log(error);
                                                                                        _deleteNetwork(id, instanceId)
                                                                                    } else {
                                                                                        Networks.update({
                                                                                            _id: id
                                                                                        }, {
                                                                                            $set: {
                                                                                                currentValidators: result.result
                                                                                            }
                                                                                        })

                                                                                        let firstAccPass = helpers.instanceIDGenerate();

                                                                                        web3.currentProvider.sendAsync({
                                                                                            method: "personal_newAccount",
                                                                                            params: [firstAccPass],
                                                                                            jsonrpc: "2.0",
                                                                                            id: new Date().getTime()
                                                                                        }, Meteor.bindEnvironment((error, result) => {
                                                                                            if (error) {
                                                                                                console.log(error);
                                                                                                _deleteNetwork(id, instanceId)
                                                                                            } else {

                                                                                                BCAccounts.insert({
                                                                                                    "instanceId": instanceId,
                                                                                                    "address": result.result,
                                                                                                    "password": firstAccPass
                                                                                                }, Meteor.bindEnvironment((error) => {
                                                                                                    if(error) {
                                                                                                        console.log(error);
                                                                                                        _deleteNetwork(id, instanceId)
                                                                                                    } else {
                                                                                                        web3.currentProvider.sendAsync({
                                                                                                            method: "personal_unlockAccount",
                                                                                                            params: [result.result, firstAccPass, 0],
                                                                                                            jsonrpc: "2.0",
                                                                                                            id: new Date().getTime()
                                                                                                        }, Meteor.bindEnvironment(function(error, result) {
                                                                                                            if (error) {
                                                                                                                console.log(error);
                                                                                                                _deleteNetwork(id, instanceId)
                                                                                                            } else {
                                                                                                                var assetsContract = web3.eth.contract(smartContracts.assets.abi);
                                                                                                                var assets = assetsContract.new({
                                                                                                                    from: web3.eth.accounts[0],
                                                                                                                    data: smartContracts.assets.bytecode,
                                                                                                                    gas: '999999999999999999'
                                                                                                                }, Meteor.bindEnvironment(function(error, contract) {
                                                                                                                    if (error) {
                                                                                                                        console.log(error);
                                                                                                                        _deleteNetwork(id, instanceId)
                                                                                                                    } else {
                                                                                                                        if (typeof contract.address !== 'undefined') {
                                                                                                                            var assetsContractAddress = contract.address;
                                                                                                                            var atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
                                                                                                                            var atomicSwap = atomicSwapContract.new(assetsContractAddress, {
                                                                                                                                from: web3.eth.accounts[0],
                                                                                                                                data: smartContracts.atomicSwap.bytecode,
                                                                                                                                gas: '999999999999999999'
                                                                                                                            }, Meteor.bindEnvironment(function(error, contract) {
                                                                                                                                if (error) {
                                                                                                                                    console.log(error);
                                                                                                                                    _deleteNetwork(id, instanceId)
                                                                                                                                } else {
                                                                                                                                    if (typeof contract.address !== 'undefined') {
                                                                                                                                        var atomicSwapContractAddress = contract.address;

                                                                                                                                        var streamsContract = web3.eth.contract(smartContracts.streams.abi);
                                                                                                                                        var atomicSwap = streamsContract.new({
                                                                                                                                            from: web3.eth.accounts[0],
                                                                                                                                            data: smartContracts.streams.bytecode,
                                                                                                                                            gas: '999999999999999999'
                                                                                                                                        }, Meteor.bindEnvironment(function(error, contract) {
                                                                                                                                            if (error) {
                                                                                                                                                console.log(error);
                                                                                                                                                _deleteNetwork(id, instanceId)
                                                                                                                                            } else {
                                                                                                                                                if (typeof contract.address !== 'undefined') {
                                                                                                                                                    var streamsContractAddress = contract.address;
                                                                                                                                                    web3.eth.getBlock(0, Meteor.bindEnvironment(function(error, block) {
                                                                                                                                                        if(error) {
                                                                                                                                                            console.log(error);
                                                                                                                                                            _deleteNetwork(id, instanceId)
                                                                                                                                                        } else {
                                                                                                                                                            Networks.update({
                                                                                                                                                                _id: id
                                                                                                                                                            }, {
                                                                                                                                                                $set: {
                                                                                                                                                                    "status": "running",
                                                                                                                                                                    "assetsContractAddress": assetsContractAddress,
                                                                                                                                                                    "atomicSwapContractAddress": atomicSwapContractAddress,
                                                                                                                                                                    "streamsContractAddress": streamsContractAddress,
                                                                                                                                                                    "jsonRPC-password": instanceId,
                                                                                                                                                                    "restAPI-password": instanceId,
                                                                                                                                                                    "genesisBlockHash": block.hash
                                                                                                                                                                }
                                                                                                                                                            })
                                                                                                                                                        }
                                                                                                                                                    }))
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }))
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }))
                                                                                                                        }
                                                                                                                    }
                                                                                                                }))
                                                                                                            }
                                                                                                        }))
                                                                                                    }
                                                                                                }))
                                                                                            }
                                                                                        }))
                                                                                    }
                                                                                }))
                                                                            }
                                                                        }))
                                                                    }
                                                                })
                                                            }, 20000)
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
}

function deleteNetwork(id){
    var myFuture = new Future();
        var kuberREST_IP = Utilities.find({
            "name": "kuberREST_IP"
        }).fetch()[0].value;

        HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/deployments/` + id, function(error, response) {
            if (error) {
                console.log(error);
                myFuture.throw("An unknown error occured");
            } else {
                HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services/` + id, function(error, response) {
                    if (error) {
                        console.log(error);
                        myFuture.throw("An unknown error occured");
                    } else {
                        HTTP.call("GET", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/replicasets?labelSelector=app%3D` + encodeURIComponent("quorum-node-" + id), function(error, response) {
                            if (error) {
                                console.log(error);
                                myFuture.throw("An unknown error occured");
                            } else {
                                HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/replicasets/` + JSON.parse(response.content).items[0].metadata.name, function(error, response) {
                                    if (error) {
                                        console.log(error);
                                        myFuture.throw("An unknown error occured");
                                    } else {
                                        HTTP.call("GET", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/pods?labelSelector=app%3D` + encodeURIComponent("quorum-node-" + id), function(error, response) {
                                            if (error) {
                                                console.log(error);
                                                myFuture.throw("An unknown error occured");
                                            } else {
                                                HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/pods/` + JSON.parse(response.content).items[0].metadata.name, function(error, response) {
                                                    if (error) {
                                                        console.log(error);
                                                        myFuture.throw("An unknown error occured");
                                                    } else {
                                                        HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/secrets/` + "basic-auth-" + id, function(error, response) {
                                                            if (error) {
                                                                console.log(error);
                                                                myFuture.throw("An unknown error occured while deleting secrets");
                                                            } else {
                                                                HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/extensions/v1beta1/namespaces/default/ingresses/` + "ingress-" + id, function(error, response) {
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
}

function joinNetwork(networkName, nodeType, genesisFileContent, totalENodes, totalConstellationNodes, assetsContractAddress, atomicSwapContractAddress, streamsContractAddress, userId){
    var myFuture = new Future();
        var instanceId = helpers.instanceIDGenerate();
        var kuberREST_IP = Utilities.find({
            "name": "kuberREST_IP"
        }).fetch()[0].value;

        function _deleteNetwork(id, instanceId) {
            HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/deployments/` + instanceId, function(error, response) {});
            HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services/` + instanceId, function(error, response) {});
            HTTP.call("GET", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/replicasets?labelSelector=app%3D` + encodeURIComponent("quorum-node-" + instanceId), function(error, response) {
                if (!error) {
                    if (JSON.parse(response.content).items.length > 0) {
                        HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/replicasets/` + JSON.parse(response.content).items[0].metadata.name, function(error, response) {
                            HTTP.call("GET", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/pods?labelSelector=app%3D` + encodeURIComponent("quorum-node-" + instanceId), function(error, response) {
                                if (!error) {
                                    if (JSON.parse(response.content).items.length > 0) {
                                        HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/pods/` + JSON.parse(response.content).items[0].metadata.name, function(error, response) {
                                            HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/secrets/` + "basic-auth-" + instanceId, function(error, response) {})
                                            HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/extensions/v1beta1/namespaces/default/ingresses/` + "ingress-" + instanceId, function(error, response) {})
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
            "status": "initializing",
            "peerType": nodeType,
            "user": userId ? userId : this.userId,
            "createdOn": Date.now(),
            "totalENodes": totalENodes,
            "totalConstellationNodes": totalConstellationNodes,
            "genesisBlock": genesisFileContent,
            "assetsContractAddress": assetsContractAddress,
            "atomicSwapContractAddress": atomicSwapContractAddress,
            "streamsContractAddress": streamsContractAddress
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
        app: quorum-node-${instanceId}
    spec:
      containers:
      - name: quorum
        image: 402432300121.dkr.ecr.us-west-2.amazonaws.com/quorum
        command: [ "bin/bash", "-c", "./setup.sh ${totalConstellationNodes} ${totalENodes} '${genesisFileContent}'  mine" ]
        imagePullPolicy: Always
        ports:
        - containerPort: 8545
        - containerPort: 23000
        - containerPort: 9001
        - containerPort: 6382
      - name: scanner
        image: 402432300121.dkr.ecr.us-west-2.amazonaws.com/scanner
        env:
        - name: instanceId
          value: ${instanceId}
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
        app: quorum-node-${instanceId}
    spec:
      containers:
      - name: quorum
        image: 402432300121.dkr.ecr.us-west-2.amazonaws.com/quorum
        command: [ "bin/bash", "-c", "./setup.sh ${totalConstellationNodes} ${totalENodes} '${genesisFileContent}'" ]
        imagePullPolicy: Always
        ports:
        - containerPort: 8545
        - containerPort: 23000
        - containerPort: 9001
        - containerPort: 6382
      - name: scanner
        image: 402432300121.dkr.ecr.us-west-2.amazonaws.com/scanner
        env:
        - name: instanceId
          value: ${instanceId}
      imagePullSecrets:
      - name: regsecret`;
                }

                HTTP.call("POST", `http://${kuberREST_IP}:8000/apis/apps/v1beta1/namespaces/default/deployments`, {
                    "content": content,
                    "headers": {
                        "Content-Type": "application/yaml"
                    }
                }, function(error, response) {
                    if (error) {
                        console.log(error);
                        _deleteNetwork(id, instanceId)
                    } else {
                        HTTP.call("POST", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services`, {
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
                                            "name":"utility",
                                            "port":6382
                                        }
                                    ],
                                    "selector":{
                                        "app":"quorum-node-" + instanceId
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
                                _deleteNetwork(id, instanceId)
                            } else {

                                HTTP.call("GET", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services/` + instanceId, {}, function(error, response) {
                                    if (error) {
                                        console.log(error);
                                        _deleteNetwork(id, instanceId)
                                    } else {
                                        let rpcNodePort = response.data.spec.ports[0].nodePort
                                        Networks.update({
                                            _id: id
                                        }, {
                                            $set: {
                                                rpcNodePort: response.data.spec.ports[0].nodePort,
                                                constellationNodePort: response.data.spec.ports[1].nodePort,
                                                ethNodePort: response.data.spec.ports[2].nodePort,
                                                utilityPort: response.data.spec.ports[3].nodePort,
                                                clusterIP: response.data.spec.clusterIP,
                                                realRPCNodePort: 8545,
                                                realConstellationNodePort: 9001,
                                                realEthNodePort: 23000,
                                                realUtilityPort: 6382
                                            }
                                        })

                                        let encryptedPassword = md5(instanceId);
                                        let auth = base64.encode(utf8.encode(instanceId + ":" + encryptedPassword))
                                        HTTP.call("POST", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/secrets`, {
                                            "content": JSON.stringify({
                                                "apiVersion": "v1",
                                                "data": {
                                                    "auth": auth
                                                },
                                                "kind": "Secret",
                                                "metadata": {
                                                    "name": "basic-auth-" + instanceId,
                                                    "namespace": "default"
                                                },
                                                "type": "Opaque"
                                            }),
                                            "headers": {
                                                "Content-Type": "application/json"
                                            }
                                        }, function(error) {
                                            if (error) {
                                                console.log(error);
                                                _deleteNetwork(id, instanceId)
                                            } else {
                                                HTTP.call("POST", `http://${kuberREST_IP}:8000/apis/extensions/v1beta1/namespaces/default/ingresses`, {
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
                                                                    "ingress.kubernetes.io/enable-cors": "true",
                                                                    "ingress.kubernetes.io/cors-credentials": "true",
                                                                    "kubernetes.io/ingress.class": "nginx",
                                                                    "ingress.kubernetes.io/configuration-snippet": "if ($http_origin ~* (^https?://([^/]+\\.)*(localhost:3000|app.blockcluster.io))) {\n    set $cors \"true\";\n}\n# Nginx doesn't support nested If statements. This is where things get slightly nasty.\n# Determine the HTTP request method used\nif ($request_method = 'OPTIONS') {\n    set $cors \"${cors}options\";\n}\nif ($request_method = 'GET') {\n    set $cors \"${cors}get\";\n}\nif ($request_method = 'POST') {\n    set $cors \"${cors}post\";\n}\n\nif ($cors = \"true\") {\n    # Catch all incase there's a request method we're not dealing with properly\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n}\n\nif ($cors = \"trueget\") {\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n    add_header 'Access-Control-Allow-Credentials' 'true';\n    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';\n    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';\n}\n\nif ($cors = \"trueoptions\") {\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n\n    #\n    # Om nom nom cookies\n    #\n    add_header 'Access-Control-Allow-Credentials' 'true';\n    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';\n\n    #\n    # Custom headers and headers various browsers *should* be OK with but aren't\n    #\n    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';\n\n    #\n    # Tell client that this pre-flight info is valid for 20 days\n    #\n    add_header 'Access-Control-Max-Age' 1728000;\n    add_header 'Content-Type' 'text/plain charset=UTF-8';\n    add_header 'Content-Length' 0;\n    return 204;\n}\n\nif ($cors = \"truepost\") {\n    add_header 'Access-Control-Allow-Origin' \"$http_origin\";\n    add_header 'Access-Control-Allow-Credentials' 'true';\n    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';\n    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';\n}"
                                                                }
                                                            },
                                                            "spec": {
                                                                "tls": [
                                                                    {
                                                                        "hosts": [
                                                                            "app.blockcluster.io"
                                                                        ],
                                                                        "secretName": "blockcluster-ssl"
                                                                    }
                                                                ],
                                                                "rules": [{
                                                                    "host": "app.blockcluster.io",
                                                                    "http": {
                                                                        "paths": [{
                                                                            "path": "/node/" + instanceId,
                                                                            "backend": {
                                                                                "serviceName": instanceId,
                                                                                "servicePort": 8545
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
                                                            _deleteNetwork(id, instanceId)
                                                        } else {
                                                            myFuture.return();

                                                            var workerNodeIP = Utilities.find({
                                                                "name": "workerNodeIP"
                                                            }).fetch()[0].value;

                                                            Meteor.setTimeout(() => {

                                                                HTTP.call("GET", "http://" + workerNodeIP + ":" + response.data.spec.ports[3].nodePort + "/nodeInfo", function(error, response) {
                                                                    if (error) {
                                                                        console.log(error);
                                                                        _deleteNetwork(id, instanceId)
                                                                    } else {
                                                                        var data = JSON.parse(response.content);
                                                                        Networks.update({
                                                                            _id: id
                                                                        }, {
                                                                            $set: {
                                                                                nodeKey: data.nodekey,
                                                                                nodeEthAddress: "0x" + lightwallet.keystore._computeAddressFromPrivKey(data.nodekey),
                                                                                constellationPubKey: data.constellationPublicKey
                                                                            }
                                                                        })

                                                                        let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + rpcNodePort));
                                                                        web3.currentProvider.sendAsync({
                                                                            method: "admin_nodeInfo",
                                                                            params: [],
                                                                            jsonrpc: "2.0",
                                                                            id: new Date().getTime()
                                                                        }, Meteor.bindEnvironment(function(error, result) {
                                                                            if (error) {
                                                                                console.log(error);
                                                                                _deleteNetwork(id, instanceId)
                                                                            } else {
                                                                                Networks.update({
                                                                                    _id: id
                                                                                }, {
                                                                                    $set: {
                                                                                        nodeId: result.result.id,
                                                                                    }
                                                                                })

                                                                                web3.currentProvider.sendAsync({
                                                                                    method: "istanbul_getValidators",
                                                                                    params: [],
                                                                                    jsonrpc: "2.0",
                                                                                    id: new Date().getTime()
                                                                                }, Meteor.bindEnvironment(function(error, result) {
                                                                                    if (error) {
                                                                                        console.log(error);
                                                                                        _deleteNetwork(id, instanceId)
                                                                                    } else {
                                                                                        let currentValidators = result.result;
                                                                                        let firstAccPass = helpers.instanceIDGenerate();
                                                                                        web3.currentProvider.sendAsync({
                                                                                            method: "personal_newAccount",
                                                                                            params: [firstAccPass],
                                                                                            jsonrpc: "2.0",
                                                                                            id: new Date().getTime()
                                                                                        }, Meteor.bindEnvironment(function(error, result) {
                                                                                            if (error) {
                                                                                                console.log(error);
                                                                                                _deleteNetwork(id, instanceId)
                                                                                            } else {
                                                                                                BCAccounts.insert({
                                                                                                    "instanceId": instanceId,
                                                                                                    "address": result.result,
                                                                                                    "password": firstAccPass
                                                                                                }, Meteor.bindEnvironment((error) => {
                                                                                                    if(error) {
                                                                                                        console.log(error);
                                                                                                        _deleteNetwork(id, instanceId)
                                                                                                    } else {
                                                                                                        web3.currentProvider.sendAsync({
                                                                                                            method: "personal_unlockAccount",
                                                                                                            params: [result.result, firstAccPass, 0],
                                                                                                            jsonrpc: "2.0",
                                                                                                            id: new Date().getTime()
                                                                                                        }, Meteor.bindEnvironment(function(error, result) {
                                                                                                            if (error) {
                                                                                                                console.log(error);
                                                                                                                _deleteNetwork(id, instanceId)
                                                                                                            } else {
                                                                                                                web3.eth.getBlock(0, Meteor.bindEnvironment(function(error, block) {
                                                                                                                    if(error) {
                                                                                                                        console.log(error);
                                                                                                                        _deleteNetwork(id, instanceId)
                                                                                                                    } else {
                                                                                                                        Networks.update({
                                                                                                                            _id: id
                                                                                                                        }, {
                                                                                                                            $set: {
                                                                                                                                currentValidators: currentValidators,
                                                                                                                                "status": "running",
                                                                                                                                "jsonRPC-password": instanceId,
                                                                                                                                "restAPI-password": instanceId,
                                                                                                                                "genesisBlockHash": block.hash
                                                                                                                            }
                                                                                                                        })
                                                                                                                    }
                                                                                                                }))
                                                                                                            }
                                                                                                        }))
                                                                                                    }
                                                                                                }))
                                                                                            }
                                                                                        }))
                                                                                    }
                                                                                }))
                                                                            }
                                                                        }))
                                                                    }
                                                                })
                                                            }, 20000)
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
}

function vote(networkId, toVote){
    var myFuture = new Future();
    var network = Networks.find({
        _id: networkId
    }).fetch()[0];
    var workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));
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
}

function unVote(networkId, toVote){
    var myFuture = new Future();
        var network = Networks.find({
            _id: networkId
        }).fetch()[0];
        var workerNodeIP = Utilities.find({
            "name": "workerNodeIP"
        }).fetch()[0].value;
        let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));
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
}

function createAccount(password, networkId){
    var myFuture = new Future();
        var network = Networks.find({
            _id: networkId
        }).fetch()[0];

        var workerNodeIP = Utilities.find({
            "name": "workerNodeIP"
        }).fetch()[0].value;

        let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

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
}

function inviteUserToNetwork(networkId, nodeType, email){
    let user = Accounts.findUserByEmail(email);
        var network = Networks.find({
            _id: networkId
        }).fetch()[0];
        if (user) {
            Meteor.call(
                "joinNetwork",
                network.name,
                nodeType,
                network.genesisBlock.toString(), ["enode://" + network.nodeId + "@" + network.clusterIP + ":" + network.realEthNodePort].concat(network.totalENodes), [network.clusterIP + ":" + network.realConstellationNodePort].concat(network.totalConstellationNodes),
                network.assetsContractAddress,
                network.atomicSwapContractAddress,
                network.streamsContractAddress,
                user._id
            )
        } else {
            throw new Meteor.Error(500, 'Unknown error occured');
        }
}

export {createNetwork, deleteNetwork, joinNetwork, vote, unVote, createAccount, inviteUserToNetwork}