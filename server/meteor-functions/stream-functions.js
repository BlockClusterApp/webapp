import Web3 from "web3";
import {
    Networks
} from "../../imports/collections/networks/networks"
import {
    Utilities
} from "../../imports/collections/utilities/utilities"
import {
    Streams
} from "../../imports/collections/streams/streams"
import smartContracts from "../../imports/modules/smart-contracts"

require("../../imports/startup/server/")

const Future = Npm.require("fibers/future");



function createStream(instanceId, name, issuer) {
    const myFuture = new Future();
    const network = Networks.find({
        instanceId
    }).fetch()[0];
    const workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

    const streamsContract = web3.eth.contract(smartContracts.streams.abi);
    const streams = streamsContract.at(network.streamsContractAddress);

    streams.createStream.sendTransaction(name, {
        from: issuer,
        gas: '99999999999999999'
    }, (error) => {
        if (!error) {
            myFuture.return();
        } else {
            myFuture.throw("An unknown error occured");
        }
    })

    return myFuture.wait();
}

function publishStream(instanceId, name, issuer, key, data) {
    const myFuture = new Future();
    const network = Networks.find({
        instanceId
    }).fetch()[0];
    const workerNodeIP = Utilities.find({
        "name": "workerNodeIP"
    }).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

    const streamsContract = web3.eth.contract(smartContracts.streams.abi);
    const streams = streamsContract.at(network.streamsContractAddress);

    streams.publish.sendTransaction(name, key, data, {
        from: issuer,
        gas: '99999999999999999'
    }, (error) => {
        if (!error) {
            myFuture.return();
        } else {
            myFuture.throw("An unknown error occured");
        }
    })

    return myFuture.wait();
}

function subscribeStream(instanceId, name) {

    Streams.update({
        instanceId,
        streamName: name
    }, {
        $set: {
            subscribed: true
        }
    })
}

function unsubscribeStream(instanceId, name) {

    Streams.update({
        instanceId,
        streamName: name
    }, {
        $set: {
            subscribed: false
        }
    })
}


export {createStream, publishStream, subscribeStream, unsubscribeStream};