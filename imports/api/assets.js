import {Networks} from "../collections/networks/networks.js"
import {Utilities} from "../collections/utilities/utilities.js"
import smartContracts from "../modules/smart-contracts"
import Web3 from "web3";

JsonRoutes.add("post", "/networks/:networkId/assetType/:assetType/issueAsset", function (req, res, next) {
    //console.log(req.body)
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
        assets.issueSoloAsset.sendTransaction(req.body.assetName, req.body.toAccount, req.body.identifier, JSON.stringify(req.body.data), {
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
