import {Networks} from "../collections/networks/networks.js"
import {Utilities} from "../collections/utilities/utilities.js"
import smartContracts from "../modules/smart-contracts"
import Web3 from "web3";
import RedisJwt from "redis-jwt";

const jwt = new RedisJwt({
    host: Utilities.find({"name": "redis"}).fetch()[0].ip,
    port: Utilities.find({"name": "redis"}).fetch()[0].port,
    secret: 'rch4nuct90i3t9ik#%$^&u3jrmv29r239cr2',
    multiple: true
})

JsonRoutes.add("post", "/login", function(req, res, next) {
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
                    token: token
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

JsonRoutes.add("post", "/logout", function(req, res, next) {
    var token = req.headers['x-access-token'];
    const call = jwt.call();
    jwt.verify(token).then(decode => {
        call.destroy(decode.rjwt).then(() => {
            res.end(JSON.stringify({
                "message": "Logout successful"
            }))
        }).catch(() => {
            JsonRoutes.sendResult(res, {
                code: 401,
                data: {"error": "An unknown error occured"}
            })
        })
    }).catch(err => {
        JsonRoutes.sendResult(res, {
            code: 401,
            data: {"error": "Invalid JWT token"}
        })
    })
})

function authMiddleware(req, res, next) {
    var token = req.headers['x-access-token'];
    jwt.verify(token).then(decode => {
        if(decode == false) {
            JsonRoutes.sendResult(res, {
                code: 401,
                data: {"error": "Invalid JWT token"}
            })
        } else {
            req.networkId = decode.id;
            next();
        }
    }).catch(err => {
        JsonRoutes.sendResult(res, {
            code: 401,
            data: {"error": "Invalid JWT token"}
        })
    })
}

JsonRoutes.Middleware.use("/assets", authMiddleware);
JsonRoutes.Middleware.use("/streams", authMiddleware);

JsonRoutes.add("post", "/networks/:networkId/assetType/:assetType/issueAsset", function (req, res, next) {
    var network = Networks.find({instanceId: req.params.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);
    if(req.params.assetType === "bulk") {
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
    } else if (req.params.assetType === "solo") {
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
    } else {
        res.end(JSON.stringify({"error": "Asset type invalid"}))
    }
});

JsonRoutes.add("post", "/networks/:networkId/assetType/:assetType/transferAsset", function (req, res, next) {
    //console.log(req.body)
    var network = Networks.find({instanceId: req.params.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);
    if(req.params.assetType === "bulk") {
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
    } else if (req.params.assetType === "solo") {
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
    } else {
        res.end(JSON.stringify({"error": "Asset type invalid"}))
    }
});

JsonRoutes.add("post", "/networks/:networkId/assetType/:assetType/getAssetInfo", function (req, res, next) {
    //console.log(req.body)
    var network = Networks.find({instanceId: req.params.networkId}).fetch()[0]
    var accounts = network.accounts;
    var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

    var assetsContract = web3.eth.contract(smartContracts.assets.abi);
    var assets = assetsContract.at(network.assetsContractAddress);


    if(req.params.assetType === "bulk") {
        assets.getBulkAssetUnits.call(req.body.assetName, req.body.account, {from: web3.eth.accounts[0]}, function(error, units){
            if(error) {
                res.end(JSON.stringify({"error": error.toString()}))
            } else {
                res.end(JSON.stringify({"units": units.toString()}))
            }
        })
    } else if (req.params.assetType === "solo") {
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
    } else {
        res.end(JSON.stringify({"error": "Asset type invalid"}))
    }
});

JsonRoutes.add("post", "/networks/:networkId/addUpdateAssetInfo", function (req, res, next) {
    //console.log(req.body)
    var network = Networks.find({instanceId: req.params.networkId}).fetch()[0]
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

JsonRoutes.add("post", "/networks/:networkId/closeAsset", function (req, res, next) {
    //console.log(req.body)
    var network = Networks.find({instanceId: req.params.networkId}).fetch()[0]
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
