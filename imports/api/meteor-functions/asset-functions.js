/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */

import Web3 from "web3";
import {
    Networks
} from "../../imports/collections/networks/networks"
import {
    Utilities
} from "../../imports/collections/utilities/utilities"
import {
    SoloAssets
} from "../../imports/collections/soloAssets/soloAssets"
import {
    AssetTypes
} from "../../imports/collections/assetTypes/assetTypes"
import helpers from "../../imports/modules/helpers"
import smartContracts from "../../imports/modules/smart-contracts"

require("../../imports/startup/server/")

const Future = Npm.require("fibers/future");

const BigNumber = require('bignumber.js');


function createAssetType(instanceId, assetName, assetType, assetIssuer, reissuable, parts){
    const myFuture = new Future();
        const network = Networks.find({
            instanceId
        }).fetch()[0];
        const workerNodeIP = Utilities.find({
            "name": "workerNodeIP"
        }).fetch()[0].value;
        const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

        const assetsContract = web3.eth.contract(smartContracts.assets.abi);
        const assets = assetsContract.at(network.assetsContractAddress);

        if (assetType === "solo") {
            assets.createSoloAssetType.sendTransaction(assetName, {
                from: assetIssuer,
                gas: '99999999999999999'
            }, (error) => {
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
            }, (error) => {
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
    const myFuture = new Future();
    const network = Networks.find({
        instanceId: networkId
    }).fetch()[0]
    const workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));
    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);
    const parts = assets.getBulkAssetParts.call(assetName)
    units = (new BigNumber(units)).multipliedBy(helpers.addZeros(1, parts))
    assets.issueBulkAsset.sendTransaction(assetName, units.toString(), toAddress, {
        from: fromAddress,
    }, (error) => {
        if (error) {
            myFuture.throw("An unknown error occured");
        } else {
            myFuture.return();
        }
    })
    return myFuture.wait();
}

function issueSoloAsset(instanceId, assetName, fromAddress, toAddress, identifier){
    const myFuture = new Future();
    const network = Networks.find({
        instanceId
    }).fetch()[0]
    const workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));
    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);
    assets.issueSoloAsset.sendTransaction(assetName, toAddress, identifier, {
        from: fromAddress,
    }, (error) => {
        if (error) {
            myFuture.throw("An unknown error occured");
        } else {
            myFuture.return();
        }
    })
    return myFuture.wait();
}

function transferBulkAssets(instanceId, assetName, fromAddress, toAddress, units){
    const myFuture = new Future();
    const network = Networks.find({
        instanceId
    }).fetch()[0]
    const workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));
    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);
    const parts = assets.getBulkAssetParts.call(assetName)
    units = (new BigNumber(units)).multipliedBy(helpers.addZeros(1, parts))
    assets.transferBulkAssetUnits.sendTransaction(assetName, toAddress, units, {
        from: fromAddress
    }, (error) => {
        if (error) {
            myFuture.throw("An unknown error occured");
        } else {
            myFuture.return();
        }
    })
    return myFuture.wait();
}

function transferSoloAsset(instanceId, assetName, fromAddress, toAddress, identifier){
    const myFuture = new Future();
    const network = Networks.find({
        instanceId
    }).fetch()[0]
    const workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));
    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);
    assets.transferOwnershipOfSoloAsset.sendTransaction(assetName, identifier, toAddress, {
        from: fromAddress
    }, (error) => {
        if (error) {
            myFuture.throw("An unknown error occured");
        } else {
            myFuture.return();
        }
    })
    return myFuture.wait();
}

function getBulkAssetBalance(instanceId, assetName, address){
    const myFuture = new Future();
    const network = Networks.find({
        instanceId
    }).fetch()[0]
    const workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));
    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);
    const parts = assets.getBulkAssetParts.call(assetName)
    assets.getBulkAssetUnits.call(assetName, address, {}, (error, units) => {
        if (error) {
            myFuture.throw("An unknown error occured");
        } else {
            units = (new BigNumber(units)).dividedBy(helpers.addZeros(1, parts)).toFixed(parseInt(parts, 10))
            myFuture.return(units.toString());
        }
    })
    return myFuture.wait();
}

function getSoloAssetInfo(instanceId, assetName, identifier){
    const myFuture = new Future();
    const network = Networks.find({
        instanceId
    }).fetch()[0]
    const workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));
    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);
    const properties = []

    const addedOrUpdatedSoloAssetExtraData_events = assets.addedOrUpdatedSoloAssetExtraData({}, {
        fromBlock: 0,
        toBlock: "latest"
    })
    addedOrUpdatedSoloAssetExtraData_events.get((error, events) => {
        if (!error) {
            for (let count = 0; count < events.length; count++) {
                // eslint-disable-next-line
                properties.indexOf(events[count].args.key) === -1 ? properties.push(events[count].args.key) : null;
            }
            assets.isSoloAssetClosed.call(assetName, identifier, {}, (_error, isClosed) => {
                if (!_error) {
                    assets.getSoloAssetOwner.call(assetName, identifier, {}, (__error, owner) => {
                        if (!__error) {
                            const extraData = {};

                            if (properties.length > 0) {
                                for (let count = 0; count < properties.length; count++) {
                                    extraData[properties[count]] = assets.getSoloAssetExtraData.call(assetName, identifier, properties[count])
                                }
                            }

                            myFuture.return({
                                "details": {
                                    isClosed,
                                    owner,
                                    extraData
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
    const myFuture = new Future();
    const network = Networks.find({
        instanceId
    }).fetch()[0]
    const workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));
    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);

    assets.addOrUpdateSoloAssetExtraData.sendTransaction(assetName, identifier, key, value, {
        from: fromAddress,
        gas: '4712388'
    }, (error) => {
        if (error) {
            myFuture.throw("An unknown error occured");
        } else {
            myFuture.return();
        }
    })

    return myFuture.wait();
}

function closeAsset(instanceId, assetName, fromAddress, identifier){
    const myFuture = new Future();
    const network = Networks.find({
        instanceId
    }).fetch()[0]
    const workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));
    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);

    assets.closeSoloAsset.sendTransaction(assetName, identifier, {
        from: fromAddress,
        gas: '4712388'
    }, (error) => {
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
        instanceId,
        assetName: name
    }, {
        $set: {
            subscribed: true
        }
    })
}

function unsubscribeAssetType(instanceId, name) {
    AssetTypes.update({
        instanceId,
        assetName: name
    }, {
        $set: {
            subscribed: false
        }
    })
}

function updateAssetTypeCreatedNotifyURL(instanceId, url) {
    const network = Networks.find({
        instanceId
    }).fetch()[0];

    const notificationURLs = network.notificationURLs || {};
    notificationURLs.assetTypeCreated = url;

    Networks.update({
        instanceId
    }, {
        $set: {
            notificationURLs
        }
    })
}
export {createAssetType, issueBulkAssets, issueSoloAsset, transferBulkAssets, transferSoloAsset, getBulkAssetBalance, getSoloAssetInfo, addUpdateSoloAssetInfo, closeAsset,searchSoloAssets,unsubscribeAssetType, subscribeAssetType, updateAssetTypeCreatedNotifyURL}
