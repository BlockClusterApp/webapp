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



function placeOrder(instanceId,
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
    otherInstanceId){

        var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0]
        var workerNodeIP = Utilities.find({
            "name": "workerNodeIP"
        }).fetch()[0].value;
        let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));
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
    }

function fullfillOrder(instanceId,
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
        }).fetch()[0]
        var workerNodeIP = Utilities.find({
            "name": "workerNodeIP"
        }).fetch()[0].value;
        let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));
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
    }

function claimOrder(instanceId, atomicSwapHash, fromAddress, toAssetType, toAssetName, toAssetId, toAssetUnits) {
    var myFuture = new Future();
    var network = Networks.find({
        instanceId: instanceId
    }).fetch()[0];
    var workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));
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
}

function cancelOrder(instanceId, orderId, fromAddress) {
    var myFuture = new Future();
    var network = Networks.find({
        instanceId: instanceId
    }).fetch()[0]
    var workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));
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
}

export {placeOrder, fullfillOrder, claimOrder, cancelOrder}