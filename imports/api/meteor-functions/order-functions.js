/* eslint-disable no-shadow */

import Web3 from "web3";
import {
    Networks
} from "../../imports/collections/networks/networks"
import {
    Utilities
} from "../../imports/collections/utilities/utilities"
import {
    Secrets
} from "../../imports/collections/secrets/secrets"
import {
    AcceptedOrders
} from "../../imports/collections/acceptedOrders/acceptedOrders"
import helpers from "../../imports/modules/helpers"
import smartContracts from "../../imports/modules/smart-contracts"

require("../../imports/startup/server/")

const Future = Npm.require("fibers/future");




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

        const myFuture = new Future();
        const network = Networks.find({
            instanceId
        }).fetch()[0]
        const workerNodeIP = Utilities.find({
            "name": "workerNodeIP"
        }).fetch()[0].value;
        const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));
        const atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
        const atomicSwap = atomicSwapContract.at(network.atomicSwapContractAddress);
        const assetsContract = web3.eth.contract(smartContracts.assets.abi);
        const assets = assetsContract.at(network.assetsContractAddress);

        const secret = helpers.generateSecret();

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

        const myFuture = new Future();
        const network = Networks.find({
            instanceId: buyerInstanceId
        }).fetch()[0]
        const workerNodeIP = Utilities.find({
            "name": "workerNodeIP"
        }).fetch()[0].value;
        const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));
        const atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
        const atomicSwap = atomicSwapContract.at(network.atomicSwapContractAddress);
        const assetsContract = web3.eth.contract(smartContracts.assets.abi);
        const assets = assetsContract.at(network.assetsContractAddress);

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
    const myFuture = new Future();
    const network = Networks.find({
        instanceId
    }).fetch()[0];
    const workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));
    const atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
    const atomicSwap = atomicSwapContract.at(network.atomicSwapContractAddress);
    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);

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
                    }, Meteor.bindEnvironment((error) => {
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
    const myFuture = new Future();
    const network = Networks.find({
        instanceId
    }).fetch()[0]
    const workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));
    web3.eth.contract(smartContracts.assets.abi);
    const atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
    const atomicSwap = atomicSwapContract.at(network.atomicSwapContractAddress);

    atomicSwap.unlock.sendTransaction(
        orderId, {
            from: fromAddress,
            gas: '99999999999999999'
        },
        (error) => {
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