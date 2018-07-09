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


function createStream(instanceId, name, issuer) {
    var myFuture = new Future();
    var network = Networks.find({
        instanceId: instanceId
    }).fetch()[0];
    var workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

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
}

function publishStream(instanceId, name, issuer, key, data) {
    var myFuture = new Future();
    var network = Networks.find({
        instanceId: instanceId
    }).fetch()[0];
    var workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

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
}

function subscribeStream(instanceId, name) {
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
}

function unsubscribeStream(instanceId, name) {
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
}


export {createStream, publishStream, subscribeStream, unsubscribeStream};