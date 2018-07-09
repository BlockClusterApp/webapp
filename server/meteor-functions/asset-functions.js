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


function createAssetType(instanceId, assetName, assetType, assetIssuer, reissuable, parts){
    var myFuture = new Future();
        var network = Networks.find({
            instanceId: instanceId
        }).fetch()[0];
        var workerNodeIP = Utilities.find({
            "name": "workerNodeIP"
        }).fetch()[0].value;
        let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

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
}

function issueBulkAssets(networkId, assetName, fromAddress, toAddress, units){
    var myFuture = new Future();
    var network = Networks.find({
        instanceId: networkId
    }).fetch()[0]
    var workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));
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
}

function issueSoloAsset(instanceId, assetName, fromAddress, toAddress, identifier){
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
    assets.issueSoloAsset.sendTransaction(assetName, toAddress, identifier, {
        from: fromAddress,
    }, function(error, txnHash) {
        if (error) {
            myFuture.throw("An unknown error occured");
        } else {
            myFuture.return();
        }
    })
    return myFuture.wait();
}

function transferBulkAssets(instanceId, assetName, fromAddress, toAddress, units){
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
    var parts = assets.getBulkAssetParts.call(assetName)
    units = (new BigNumber(units)).multipliedBy(helpers.addZeros(1, parts))
    assets.transferBulkAssetUnits.sendTransaction(assetName, toAddress, units, {
        from: fromAddress
    }, function(error, txnHash) {
        if (error) {
            myFuture.throw("An unknown error occured");
        } else {
            myFuture.return();
        }
    })
    return myFuture.wait();
}

function transferSoloAsset(instanceId, assetName, fromAddress, toAddress, identifier){
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
}

function getBulkAssetBalance(instanceId, assetName, address){
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
}

function getSoloAssetInfo(instanceId, assetName, identifier){
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
}

function addUpdateSoloAssetInfo(instanceId, assetName, fromAddress, identifier, key, value){
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

    assets.addOrUpdateSoloAssetExtraData.sendTransaction(assetName, identifier, key, value, {
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
}

function closeAsset(instanceId, assetName, fromAddress, identifier){
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
}



function searchSoloAssets(instanceId, query) {
    query.instanceId = instanceId;
    return SoloAssets.find(JSON.parse(query)).fetch();
}


function subscribeAssetType(instanceId, name) {
    AssetTypes.update({
        instanceId: instanceId,
        assetName: name
    }, {
        $set: {
            subscribed: true
        }
    })
}

function unsubscribeAssetType(instanceId, name) {
    AssetTypes.update({
        instanceId: instanceId,
        assetName: name
    }, {
        $set: {
            subscribed: false
        }
    })
}

function updateAssetTypeCreatedNotifyURL(instanceId, url) {
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
}
export {createAssetType, issueBulkAssets, issueSoloAsset, transferBulkAssets, transferSoloAsset, getBulkAssetBalance, getSoloAssetInfo, addUpdateSoloAssetInfo, closeAsset,searchSoloAssets,unsubscribeAssetType, subscribeAssetType, updateAssetTypeCreatedNotifyURL}
