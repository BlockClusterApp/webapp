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


function rpcPasswordUpdate(instanceId, password){
    var myFuture = new Future();
        var kuberREST_IP = Utilities.find({
            "name": "kuberREST_IP"
        }).fetch()[0].value;
        HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/secrets/` + "basic-auth-" + instanceId, function(error, response) {
            if (error) {
                console.log(error);
                myFuture.throw("An unknown error occured while deleting secret");
            } else {
                let encryptedPassword = md5(password);
                let auth = base64.encode(utf8.encode(instanceId + ":" + password))
                HTTP.call("POST", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/secrets`, {
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
                                "jsonRPC-password": password
                            }
                        })

                        myFuture.return();
                    }
                })
            }
        })

        return myFuture.wait();
}

function restAPIPasswordUpdate(instanceId, password) {
    Networks.update({
        instanceId: instanceId
    }, {
        $set: {
            "restAPI-password": password
        }
    })
}

function addPeer(instanceId, eNodeURL) {
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
}

function downloadAccount(instanceId, accountAddress) {
        var myFuture = new Future();

        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];

        var workerNodeIP = Utilities.find({
            "name": "workerNodeIP"
        }).fetch()[0].value;

        var account = BCAccounts.find({
            instanceId: instanceId,
            address: accountAddress
        }).fetch()[0]

        HTTP.call("GET", `http://${workerNodeIP}:${network.utilityPort}/getPrivateKey?address=${accountAddress}&password=${account.password}`, function(error, response) {
            if (error) {
                myFuture.throw("An unknown error occured");
            } else {
                myFuture.return(response.content);
            }
        })

        return myFuture.wait();
    }
