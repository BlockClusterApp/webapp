/* eslint-disable camelcase */
/* eslint-disable no-shadow */
/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-param-reassign */
/* eslint-disable no-useless-concat */

import Web3 from "web3";
import RedisJwt from "redis-jwt";
import {Networks} from "../collections/networks/networks"
import {Utilities} from "../collections/utilities/utilities"
import smartContracts from "../modules/smart-contracts"
import {soloAssets} from "../collections/soloAssets/soloAssets"
import helpers from "../modules/helpers"
import {
    Orders
} from "../collections/orders/orders"
import {
    Secrets
} from "../collections/secrets/secrets"
import {
    AcceptedOrders
} from "../collections/acceptedOrders/acceptedOrders"

const BigNumber = require('bignumber.js');

const jwt = new RedisJwt({
    host: Utilities.find({"name": "redis"}).fetch()[0].ip,
    port: Utilities.find({"name": "redis"}).fetch()[0].port,
    secret: 'rch4nuct90i3t9ik#%$^&u3jrmv29r239cr2',
    multiple: true
})

JsonRoutes.add("post", "/api/login", (req, res) => {
    const network = Networks.find({instanceId: req.body.username}).fetch()[0];
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
            }).catch(() => {
                    authenticationFailed();
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

    const token = getToken(req);

    jwt.verify(token).then(decode => {
        if(!decode) {
            JsonRoutes.sendResult(res, {
                code: 401,
                data: {"error": "Invalid JWT token"}
            })
        } else {
            req.networkId = decode.id;
            req.rjwt = decode.rjwt;
            next();
        }
    }).catch(() => {
            JsonRoutes.sendResult(res, {
                code: 401,
                data: { "error": "Invalid JWT token" }
            });
        })
}

JsonRoutes.Middleware.use("/api/assets", authMiddleware);
JsonRoutes.Middleware.use("/api/streams", authMiddleware);
JsonRoutes.Middleware.use("/api/search", authMiddleware);
JsonRoutes.Middleware.use("/api/logout", authMiddleware);

JsonRoutes.add("post", "/api/logout", (req, res) => {
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

JsonRoutes.add("post", "/api/assets/issueSoloAsset", (req, res) => {
    const network = Networks.find({instanceId: req.networkId}).fetch()[0]
    const workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);
    assets.issueSoloAsset.sendTransaction(req.body.assetName, req.body.toAccount, req.body.identifier, {
        from: req.body.fromAccount,
        gas: '4712388'
    }, (error, txnHash) => {
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            for(const key in req.body.data) {
                assets.addOrUpdateSoloAssetExtraData.sendTransaction(req.body.assetName, req.body.identifier, key, req.body.data[key], {
                    from: req.body.fromAccount,
                    gas: '4712388'
                })
            }

            res.end(JSON.stringify({"txnHash": txnHash}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/issueBulkAsset", (req, res) => {
    const network = Networks.find({instanceId: req.networkId}).fetch()[0]
    const workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);
    const parts = assets.getBulkAssetParts.call(req.body.assetName)
    const units = (new BigNumber(req.body.units)).multipliedBy(helpers.addZeros(1, parts))
    assets.issueBulkAsset.sendTransaction(req.body.assetName, units, req.body.toAccount, {
        from: req.body.fromAccount,
        gas: '4712388'
    }, (error, txnHash) => {
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            res.end(JSON.stringify({"txnHash": txnHash}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/transferSoloAsset", (req, res) => {
    const network = Networks.find({instanceId: req.networkId}).fetch()[0]
    const workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);
    assets.transferOwnershipOfSoloAsset.sendTransaction(req.body.assetName, req.body.identifier, req.body.toAccount, {
        from: req.body.fromAccount,
        gas: '4712388'
    }, (error, txnHash) => {
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            res.end(JSON.stringify({"txnHash": txnHash}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/transferBulkAsset", (req, res) => {
    const network = Networks.find({instanceId: req.networkId}).fetch()[0]
    const workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);
    const parts = assets.getBulkAssetParts.call(req.body.assetName)
    const units = (new BigNumber(req.body.units)).multipliedBy(helpers.addZeros(1, parts))
    assets.transferBulkAssetUnits.sendTransaction(req.body.assetName, req.body.toAccount, units, {
        from: req.body.fromAccount,
        gas: '4712388'
    }, (error, txnHash) => {
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            res.end(JSON.stringify({"txnHash": txnHash}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/getSoloAssetInfo", (req, res) => {
    const network = Networks.find({instanceId: req.networkId}).fetch()[0]
    const workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);

    assets.isSoloAssetClosed.call(req.body.assetName, req.body.identifier, {from: web3.eth.accounts[0]}, (error, isClosed) => {
        if(!error) {
            assets.getSoloAssetOwner.call(req.body.assetName, req.body.identifier, {from: web3.eth.accounts[0]}, (error, owner) => {
                if(!error) {

                    const extraData = {};

                    for(let count = 0; count < req.body.extraData.length; count++){
                        extraData[req.body.extraData[count]] = assets.getSoloAssetExtraData.call(req.body.assetName, req.body.identifier, req.body.extraData[count])
                    }

                    res.end(JSON.stringify({"details": {
                        isClosed,
                        owner,
                        extraData
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

JsonRoutes.add("post", "/api/assets/getBulkAssetBalance", (req, res) => {
    const network = Networks.find({instanceId: req.networkId}).fetch()[0]
    const workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);
    const parts = assets.getBulkAssetParts.call(assetName)
    assets.getBulkAssetUnits.call(req.body.assetName, req.body.account, {from: web3.eth.accounts[0]}, (error, units) => {
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            units = (new BigNumber(units)).dividedBy(helpers.addZeros(1, parts)).toFixed(parseInt(parts, 10))
            res.end(JSON.stringify({"units": units.toString()}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/updateAssetInfo", (req, res) => {
    const network = Networks.find({instanceId: req.networkId}).fetch()[0]
    const workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);

    assets.addOrUpdateSoloAssetExtraData.sendTransaction(req.body.assetName, req.body.identifier, req.body.key, req.body.value, {
        from: req.body.fromAccount,
        gas: '4712388'
    }, (error, txnHash) => {
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            res.end(JSON.stringify({"txnHash": txnHash}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/closeAsset", (req, res) => {
    const network = Networks.find({instanceId: req.networkId}).fetch()[0]
    const workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);

    assets.closeSoloAsset.sendTransaction(req.body.assetName, req.body.identifier, {
        from: req.body.fromAccount,
        gas: '4712388'
    }, (error, txnHash) => {
        if(error) {
            res.end(JSON.stringify({"error": error.toString()}))
        } else {
            res.end(JSON.stringify({"txnHash": txnHash}))
        }
    })
});

JsonRoutes.add("post", "/api/assets/placeOrder", (req, res) => {
    const network = Networks.find({instanceId: req.networkId}).fetch()[0]
    const workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

    const atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
    const atomicSwap = atomicSwapContract.at(network.atomicSwapContractAddress);
    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(network.assetsContractAddress);

    const secret = helpers.generateSecret();
    const toGenesisBlockHash = Networks.find({instanceId: req.body.toNetworkId}).fetch()[0].genesisBlockHash;

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

JsonRoutes.add("post", "/api/assets/fulfillOrder", (req, res) => {
    const network = Networks.find({instanceId: req.networkId}).fetch()[0]
    const workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;

    const order = Orders.find({instanceId: req.networkId, atomicSwapHash: req.body.orderId}).fetch()[0];
    const toNetwork = Networks.find({instanceId: req.body.toNetworkId}).fetch()[0];

    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  toNetwork.rpcNodePort}`));
    const atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
    const atomicSwap = atomicSwapContract.at(toNetwork.atomicSwapContractAddress);
    const assetsContract = web3.eth.contract(smartContracts.assets.abi);
    const assets = assetsContract.at(toNetwork.assetsContractAddress);

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
                        }, Meteor.bindEnvironment((error, txHash) => {
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

                            const expiryTimestamp = order.fromLockPeriod;
                            const currentTimestamp = new Date().getTime() / 1000;
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

JsonRoutes.add("post", "/api/assets/cancelOrder", (req, res) => {
    const network = Networks.find({instanceId: req.networkId}).fetch()[0]
    const workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

    const atomicSwapContract = web3.eth.contract(smartContracts.atomicSwap.abi);
    const atomicSwap = atomicSwapContract.at(network.atomicSwapContractAddress);
    const assetsContract = web3.eth.contract(smartContracts.assets.abi);

    const order = Orders.find({instanceId: req.networkId, atomicSwapHash: req.body.orderId}).fetch()[0];

    atomicSwap.unlock.sendTransaction(
        req.body.orderId, {
            from: order.fromAddress,
            gas: '99999999999999999'
        },
        (error, txHash) => {
            if (error) {
                res.end(JSON.stringify({"error": error.toString()}))
            } else {
                res.end(JSON.stringify({"txnHash": txHash}))
            }
        }
    )
})

JsonRoutes.add("post", "/api/assets/getOrderInfo", (req, res) => {
    const order = Orders.find({instanceId: req.networkId, atomicSwapHash: req.body.orderId}).fetch();

    if(order[0]) {
        res.end(JSON.stringify(order[0]))
    } else {
        res.end(JSON.stringify({"error": "Order not found"}))
    }
})

JsonRoutes.add("post", "/api/searchAssets", (req, res) => {
    const query = req.body;
    query.instanceId = req.networkId;
    const result = soloAssets.find(query).fetch();

    res.end(JSON.stringify(result))
});

JsonRoutes.add("post", "/api/searchStreamsItems", (req, res) => {
    const query = req.body;
    query.instanceId = req.networkId;
    const result = streams.find(query).fetch();

    res.end(JSON.stringify(result))
});

JsonRoutes.add("post", "/api/streams/publish", (req, res) => {
    const network = Networks.find({instanceId: req.networkId}).fetch()[0]
    const workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${  workerNodeIP  }:${  network.rpcNodePort}`));

    const streamsContract = web3.eth.contract(smartContracts.streams.abi);
    const streams = streamsContract.at(network.streamsContractAddress);

    streams.publish.sendTransaction(req.body.streamName, req.body.key, req.body.data, {
        from: req.body.fromAccount
    }, (error, txnHash) => {
        if (!error) {
            res.end(JSON.stringify({"txnHash": txnHash}))
        } else {
            res.end(JSON.stringify({"error": error.toString()}))
        }
    })
});
