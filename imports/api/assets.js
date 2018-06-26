import {Networks} from "../collections/networks/networks.js"
import {Utilities} from "../collections/utilities/utilities.js"
import smartContracts from "../modules/smart-contracts"
import Web3 from "web3";
import RedisJwt from "redis-jwt";
import {SearchBlockchain} from "../collections/searchBlockchain/searchBlockchain.js"
import helpers from "../modules/helpers"
import {
    Orders
} from "../collections/orders/orders.js"
import {
    Secrets
} from "../collections/secrets/secrets.js"
import {
    AcceptedOrders
} from "../collections/acceptedOrders/acceptedOrders.js"

const jwt = new RedisJwt({
    host: Utilities.find({"name": "redis"}).fetch()[0].ip,
    port: Utilities.find({"name": "redis"}).fetch()[0].port,
    secret: 'rch4nuct90i3t9ik#%$^&u3jrmv29r239cr2',
    multiple: true
})

JsonRoutes.add("post", "/api/login", function(req, res, next) {
    var network = Networks.find({instanceId: req.body.username}).fetch()[0];
    function authenticationFailed() {
        JsonRoutes.sendResult(res, {
            code: 401,
            data: {"error": "Wrong username or password"}
        })
    }

    if(network) {
        if(network["restAPI-password"] === req.body.password) {
            jwt.sign(network.instanceId, {
                ttl: "1 year"
            }).then(token => {
                res.end(JSON.stringify({
                    access_token: token
                }))
            }).catch(err => {
                authenticationFailed()
            })
        } else {
            authenticationFailed()
        }
    } else {
        authenticationFailed()
    }
})

function authMiddleware(req, res, next) {

    function getToken(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') { // Authorization: Bearer g1jipjgi1ifjioj
            // Handle token presented as a Bearer token in the Authorization header
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            // Handle token presented as URI param
            return req.query.token;
        } else if (req.cookies && req.cookies.token) {
            // Handle token presented as a cookie parameter
            return req.cookies.token;
        }
        // If we return null, we couldn't find a token.
        // In this case, the JWT middleware will return a 401 (unauthorized) to the client for this request
        return null;
    }

    var token = getToken(req);

    jwt.verify(token).then(decode => {
        if(decode == false) {
            JsonRoutes.sendResult(res, {
                code: 401,
                data: {"error": "Invalid JWT token"}
            })
        } else {
            req.networkId = decode.id;
            req.rjwt = decode.rjwt;
            next();
        }
    }).catch(err => {
        JsonRoutes.sendResult(res, {
            code: 401,
            data: {"error": "Invalid JWT token"}
        })
    })
}

JsonRoutes.Middleware.use("/api/assets", authMiddleware);
JsonRoutes.Middleware.use("/api/streams", authMiddleware);
JsonRoutes.Middleware.use("/api/search", authMiddleware);
JsonRoutes.Middleware.use("/api/logout", authMiddleware);

JsonRoutes.add("post", "/api/logout", function(req, res, next) {
    const call = jwt.call();
    call.destroy(req.rjwt).then(() => {
        res.end(JSON.stringify({
            "message": "Logout successful"
        }))
    }).catch(() => {
        JsonRoutes.sendResult(res, {
            code: 401,
            data: {"error": "An unknown error occured"}
        })
    })
})

JsonRoutes.add("post", "/api/assets/issueSoloAsset", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);
    assets.issueSoloAsset.sendTransaction(req.body.assetName, req.body.toAccount, req.body.identifier, {
        from: req.body.fromAccount,
        gas: '4712388'
    }, function(error, txnHash){
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            for(let key in req.body.data) {
                assets.addOrUpdateSoloAssetExtraData.sendTransaction(req.body.assetName, req.body.identifier, key, req.body.data[key], {
                    from: req.body.fromAccount,
                    gas: '4712388'
                })
            }

            res.end(JSON.stringify({"txnHash": txnHash}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/issueBulkAsset", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);

    assets.issueBulkAsset.sendTransaction(req.body.assetName, req.body.units, req.body.toAccount, {
        from: req.body.fromAccount,
        gas: '4712388'
    }, function(error, txnHash){
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            res.end(JSON.stringify({"txnHash": txnHash}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/transferSoloAsset", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);
    assets.transferOwnershipOfSoloAsset.sendTransaction(req.body.assetName, req.body.identifier, req.body.toAccount, {
        from: req.body.fromAccount,
        gas: '4712388'
    }, function(error, txnHash){
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            res.end(JSON.stringify({"txnHash": txnHash}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/transferBulkAsset", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);
    assets.transferBulkAssetUnits.sendTransaction(req.body.assetName, req.body.toAccount, req.body.units, {
        from: req.body.fromAccount,
        gas: '4712388'
    }, function(error, txnHash){
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            res.end(JSON.stringify({"txnHash": txnHash}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/getSoloAssetInfo", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);

    assets.isSoloAssetClosed.call(req.body.assetName, req.body.identifier, {from: web3.eth.accounts[0]}, function(error, isClosed){
        if(!error) {
            assets.getSoloAssetOwner.call(req.body.assetName, req.body.identifier, {from: web3.eth.accounts[0]}, function(error, owner){
                if(!error) {

                    let extraData = {};

                    for(let count = 0; count < req.body.extraData.length; count++){
                        extraData[req.body.extraData[count]] = assets.getSoloAssetExtraData.call(req.body.assetName, req.body.identifier, req.body.extraData[count])
                    }

                    res.end(JSON.stringify({"details": {
                        isClosed: isClosed,
                        owner: owner,
                        extraData: extraData
                    }}))
                } else {
                    res.end(JSON.stringify({"error": error.toString()}))
                }
            })
        } else {
            res.end(JSON.stringify({"error": error.toString()}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/getBulkAssetBalance", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);
    assets.getBulkAssetUnits.call(req.body.assetName, req.body.account, {from: web3.eth.accounts[0]}, function(error, units){
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            res.end(JSON.stringify({"units": units.toString()}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/updateAssetInfo", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);

    assets.addOrUpdateSoloAssetExtraData.sendTransaction(req.body.assetName, req.body.identifier, req.body.key, req.body.value, {
        from: req.body.fromAccount,
        gas: '4712388'
    }, function(error, txnHash){
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            res.end(JSON.stringify({"txnHash": txnHash}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/closeAsset", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);

    assets.closeSoloAsset.sendTransaction(req.body.assetName, req.body.identifier, {
        from: req.body.fromAccount,
        gas: '4712388'
    }, function(error, txnHash){
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            res.end(JSON.stringify({"txnHash": txnHash}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/placeOrder", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
    var atomicSwap = atomicSwapContract.at(network.atomicSwapContractAddress);
    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);

    var secret = helpers.generateSecret();
    var toGenesisBlockHash = Networks.find({instanceId: req.body.toNetworkId}).fetch()[0].genesisBlockHash;

    atomicSwap.calculateHash.call(secret, Meteor.bindEnvironment((error, hash) => {
        if (!error) {
            Secrets.insert({
                "instanceId": req.body.toNetworkId,
                "secret": secret,
                "hash": hash,
            }, (error) => {
                if (!error) {
                    assets.approve.sendTransaction(
                        req.body.fromAssetType,
                        req.body.fromAssetName,
                        req.body.fromAssetUniqueIdentifier,
                        req.body.fromAssetUnits,
                        network.atomicSwapContractAddress, {
                            from: req.body.fromAddress,
                            gas: '99999999999999999'
                        },
                        Meteor.bindEnvironment((error) => {
                            if (!error) {
                                atomicSwap.lock.sendTransaction(
                                    req.body.toAddress,
                                    hash,
                                    req.body.fromAssetLockMinutes,
                                    req.body.fromAssetType,
                                    req.body.fromAssetName,
                                    req.body.fromAssetUniqueIdentifier,
                                    req.body.fromAssetUnits,
                                    req.body.toAssetType,
                                    req.body.toAssetName,
                                    req.body.toAssetUnits,
                                    req.body.toAssetUniqueIdentifier,
                                    toGenesisBlockHash, {
                                        from: req.body.fromAddress,
                                        gas: '99999999999999999'
                                    },
                                    Meteor.bindEnvironment((error, txnHash) => {
                                        if (!error) {
                                            res.end(JSON.stringify({"txnHash": txnHash, "orderId": hash}))
                                        } else {
                                            res.end(JSON.stringify({"error": error.toString()}))
                                        }
                                    }))
                            } else {
                                res.end(JSON.stringify({"error": error.toString()}))
                            }
                        })
                    )
                } else {
                    res.end(JSON.stringify({"error": error.toString()}))
                }
            })
        } else {
            res.end(JSON.stringify({"error": error.toString()}))
        }
    }))
})

JsonRoutes.add("post", "/api/assets/fulfillOrder", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;

    let order = Orders.find({instanceId: req.networkId, atomicSwapHash: req.body.orderId}).fetch()[0];
    let toNetwork = Networks.find({instanceId: req.body.toNetworkId}).fetch()[0];

    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + toNetwork.rpcNodePort));
    var atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
    var atomicSwap = atomicSwapContract.at(toNetwork.atomicSwapContractAddress);
    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(toNetwork.assetsContractAddress);

    if(toNetwork.genesisBlockHash === order.toGenesisBlockHash) {
        assets.approve.sendTransaction(
            order.toAssetType,
            order.toAssetName,
            order.toAssetId,
            order.toAssetUnits,
            network.atomicSwapContractAddress, {
                from: order.toAddress,
                gas: '99999999999999999'
            }, Meteor.bindEnvironment((error) => {
                if (!error) {
                    atomicSwap.claim.sendTransaction(
                        req.body.orderId,
                        "", {
                            from: order.toAddress,
                            gas: '99999999999999999'
                        }, Meteor.bindEnvironment(function(error, txHash) {
                            if (error) {
                                res.end(JSON.stringify({"error": error.toString()}))
                            } else {
                                res.end(JSON.stringify({"txnHash": txHash}))
                            }
                        }))
                } else {
                    res.end(JSON.stringify({"error": error.toString()}))
                }
            })
        )
    } else {
        AcceptedOrders.insert({
            "instanceId": req.networkId,
            "buyerInstanceId": req.body.toNetworkId,
            "hash": req.body.orderId
        }, (error) => {
            if (!error) {
                assets.approve.sendTransaction(
                    order.toAssetType,
                    order.toAssetName,
                    order.toAssetId,
                    order.toAssetUnits,
                    toNetwork.atomicSwapContractAddress, {
                        from: order.toAddress,
                        gas: '99999999999999999'
                    }, (error) => {
                        if (!error) {

                            let expiryTimestamp = order.fromLockPeriod;
                            let currentTimestamp = new Date().getTime() / 1000;
                            let newMin = null;

                            if(expiryTimestamp - currentTimestamp <= 0) {
                                res.end(JSON.stringify({"error": "Order has expired"}))
                                return;
                            } else {
                                let temp = currentTimestamp + ((expiryTimestamp - currentTimestamp) / 2)
                                temp = (temp - currentTimestamp) / 60;
                                newMin = temp;
                            }

                            atomicSwap.lock.sendTransaction(
                                order.fromAddress,
                                req.body.orderId,
                                newMin,
                                order.toAssetType,
                                order.toAssetName,
                                order.toAssetId,
                                order.toAssetUnits,
                                order.fromAssetType,
                                order.fromAssetName,
                                order.fromAssetUnits,
                                order.fromAssetId,
                                network.genesisBlockHash, {
                                    from: order.toAddress,
                                    gas: '99999999999999999'
                                },
                                (error, txnHash) => {
                                    if (!error) {
                                        res.end(JSON.stringify({"txnHash": txnHash}))
                                    } else {
                                        res.end(JSON.stringify({"error": error.toString()}))
                                    }
                                })
                        } else {
                            res.end(JSON.stringify({"error": error.toString()}))
                        }
                    }
                )
            } else {
                res.end(JSON.stringify({"error": error.toString()}))
            }
        })
    }
})

JsonRoutes.add("post", "/api/assets/cancelOrder", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
    var atomicSwap = atomicSwapContract.at(network.atomicSwapContractAddress);
    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);

    let order = Orders.find({instanceId: req.networkId, atomicSwapHash: req.body.orderId}).fetch()[0];

    atomicSwap.unlock.sendTransaction(
        req.body.orderId, {
            from: order.fromAddress,
            gas: '99999999999999999'
        },
        function(error, txHash) {
            if (error) {
                res.end(JSON.stringify({"error": error.toString()}))
            } else {
                res.end(JSON.stringify({"txnHash": txHash}))
            }
        }
    )
})

JsonRoutes.add("post", "/api/assets/getOrderInfo", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    let order = Orders.find({instanceId: req.networkId, atomicSwapHash: req.body.orderId}).fetch();

    if(order[0]) {
        res.end(JSON.stringify(order[0]))
    } else {
        res.end(JSON.stringify({"error": "Order not found"}))
    }
})

JsonRoutes.add("post", "/api/search", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    var query = req.body;
    query.instanceId = req.networkId;
    var result = SearchBlockchain.find(query).fetch();

    res.end(JSON.stringify(result))
});

JsonRoutes.add("post", "/api/streams/publish", function (req, res, next) {
    var network = Networks.find({instanceId: req.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var streamsContract = web3.eth.contract(smartContracts.streams.abi);
    var streams = streamsContract.at(network.streamsContractAddress);

    streams.publish.sendTransaction(req.body.streamName, req.body.key, req.body.data, {
        from: req.body.fromAccount
    }, function(error, txnHash) {
        if (!error) {
            res.end(JSON.stringify({"txnHash": txnHash}))
        } else {
            res.end(JSON.stringify({"error": error.toString()}))
        }
    })
});
