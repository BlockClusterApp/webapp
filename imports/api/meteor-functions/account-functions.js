/* eslint-disable camelcase */

import {
    Networks
} from "../../imports/collections/networks/networks"
import {
    Utilities
} from "../../imports/collections/utilities/utilities"
import {
    BCAccounts
} from "../../imports/collections/bcAccounts/bcAccounts"

require("../../imports/startup/server/")

const Future = Npm.require("fibers/future");

const base64 = require('base-64');
const utf8 = require('utf8');


function rpcPasswordUpdate(instanceId, password){
    const myFuture = new Future();
        const kuberREST_IP = Utilities.find({
            "name": "kuberREST_IP"
        }).fetch()[0].value;
        HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/secrets/basic-auth-${instanceId}`, (error) => {
            if (error) {
                console.log(error);
                myFuture.throw("An unknown error occured while deleting secret");
            } else {
                // const encryptedPassword = md5(password);
                const auth = base64.encode(utf8.encode(`${instanceId  }:${  password}`))
                HTTP.call("POST", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/secrets`, {
                    "content": JSON.stringify({
                        "apiVersion": "v1",
                        "data": {
                            "auth": auth
                        },
                        "kind": "Secret",
                        "metadata": {
                            "name": `basic-auth-${instanceId}`
                        },
                        "type": "Opaque"
                    }),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }, (_error) => {
                    if (error) {
                        console.log(_error);
                        myFuture.throw("An unknown error occured while creating secret");
                    } else {
                        Networks.update({
                            instanceId
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
        instanceId
    }, {
        $set: {
            "restAPI-password": password
        }
    })
}

function addPeer(instanceId, eNodeURL) {
    const network = Networks.find({
        instanceId
    }).fetch()[0]

    if (network.staticPeers === undefined) {
        network.staticPeers = [eNodeURL]
    } else {
        network.staticPeers.push(eNodeURL)
    }

    Networks.update({
        instanceId
    }, {
        $set: {
            "staticPeers": network.staticPeers
        }
    })
}

function downloadAccount(instanceId, accountAddress) {
        const myFuture = new Future();

        const network = Networks.find({
            instanceId,
        }).fetch()[0];

        const workerNodeIP = Utilities.find({
            "name": "workerNodeIP"
        }).fetch()[0].value;

        const account = BCAccounts.find({
            instanceId,
            address: accountAddress
        }).fetch()[0]

        HTTP.call("GET", `http://${workerNodeIP}:${network.utilityPort}/getPrivateKey?address=${accountAddress}&password=${account.password}`, (error, response) => {
            if (error) {
                myFuture.throw("An unknown error occured");
            } else {
                myFuture.return(response.content);
            }
        })

        return myFuture.wait();
    }


module.exports = {
    rpcPasswordUpdate,
    restAPIPasswordUpdate,
    downloadAccount,
    addPeer
}