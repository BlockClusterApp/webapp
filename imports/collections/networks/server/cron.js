import Web3 from "web3";
import {Networks} from "../networks.js"
import {Utilities} from "../../utilities/utilities.js"
import smartContracts from "../../../modules/smart-contracts"

function updateNodeStatus() {
	Meteor.setInterval(function(){
		var nodes = Networks.find({}).fetch()
		nodes.forEach(function(item, index){
			if(item.status !== "initializing") {
				var kuberREST_IP = Utilities.find({"name": "kuberREST_IP"}).fetch()[0].value;
				HTTP.call("GET", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/deployments/` + item.instanceId, function(error, response){
					if(error) {
						Networks.update({
							_id: item._id
						}, {
							$set: {
								"status": "down"
							}
						})
					} else {
						if(response.data.status.availableReplicas === 1) {
							Networks.update({
								_id: item._id
							}, {
								$set: {
									"status": "running"
								}
							})
						} else {
							Networks.update({
								_id: item._id
							}, {
								$set: {
									"status": "down"
								}
							})
						}
					}
				})
			}
		})
	}, 5000)
}

function updateAuthoritiesList() {
	Meteor.setInterval(function(){
		var nodes = Networks.find({}).fetch()
		nodes.forEach(function(item, index){
			if(item.currentValidators !== undefined) {
				var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
				let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + item.rpcNodePort));
				web3.currentProvider.sendAsync({
				    method: "istanbul_getValidators",
				    params: [],
				    jsonrpc: "2.0",
				    id: new Date().getTime()
				}, Meteor.bindEnvironment(function(error, result) {
					if(!error) {
						Networks.update({
							_id: item._id
						}, {
							$set: {
								currentValidators: result.result
							}
						})
					}
				}))
			}
		})
	}, 5000)
}

async function updateTotalSmartContracts(web3, blockNumber, totalSmartContracts) {
	fetchTxn = async (web3, txnHash) => {
		return new Promise((resolve, reject) => {
			web3.eth.getTransactionReceipt(txnHash, (error, result) => {
				if (!error && result !== null) {
					if(result.contractAddress) {
						resolve(true)
					} else {
						resolve(false)
					}
				} else {
					reject(error)
				}
			})
		});
	}

	return new Promise((resolve, reject) => {
		web3.eth.getBlock(blockNumber, async (error, result) => {
			if (!error && result !== null) {
				for(let count = 0; count < result.transactions.length; count++) {
					try {
						let isSmartContractDeploy = await fetchTxn(web3, result.transactions[count])
						if(isSmartContractDeploy) {
							totalSmartContracts++;
						}
					} catch(e) {
						reject(e)
						return;
					}
				}

				resolve(totalSmartContracts)
			} else {
				reject(error)
			}
		})
	});
}

async function indexSoloAssets(web3, blockNumber, collectionName) {
	return new Promise((resolve, reject) => {
		if(database) {
			resolve()
		} else {
			reject("Not Connected to database")
		}
	});


}

function scanBlock() {
	scan = async () => {
		var nodes = Networks.find({}).fetch()
		for(let count = 0; count < nodes.length; count++) {
			if(nodes[count].status === "running") {
				let blockToScan = (nodes[count].blockToScan ? nodes[count].blockToScan : 0);
				let totalSmartContracts = (nodes[count].totalSmartContracts ? nodes[count].totalSmartContracts : 0);
				var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
				let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + nodes[count].rpcNodePort));
				try {
					totalSmartContracts = await updateTotalSmartContracts(web3, blockToScan, totalSmartContracts)
					await indexSoloAssets(web3, blockToScan, nodes[count].instanceId + "_soloAssets")
					Networks.update({
						_id: nodes[count]._id
					}, {
						$set: {
							blockToScan: blockToScan + 1,
							totalSmartContracts: totalSmartContracts
						}
					})
				} catch(e) {
				}
			}

			Meteor.setTimeout(scan, 100)
		}

		if(nodes.length === 0) {
			Meteor.setTimeout(scan, 100)
		}
	}

	Meteor.setTimeout(scan, 100)
}


function unlockAccounts() {
	Meteor.setInterval(function(){
		var nodes = Networks.find({}).fetch()
		nodes.forEach(function(item, index){
			var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
			var web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + item.rpcNodePort));
			if(item.accounts) {
				for(var count = 0; count < item.accounts.length; count++) {
					web3.currentProvider.sendAsync({
					    method: "personal_unlockAccount",
					    params: [item.accounts[count], item.accountsPassword[item.accounts[count]], 0],
					    jsonrpc: "2.0",
					    id: new Date().getTime()
					}, Meteor.bindEnvironment(function(error, result) {}))
				}
			}
		})
	}, 5000)
}

function updateAssetsInfo() {
	Meteor.setInterval(function(){
		var nodes = Networks.find({}).fetch()
		nodes.forEach(function(item, index){
			var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
			var web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + item.rpcNodePort));
			var assetsContract = web3.eth.contract(smartContracts.assets.abi);
			var assets = assetsContract.at(item.assetsContractAddress);
			var events = assets.allEvents({fromBlock: 0, toBlock: "latest"});

			events.get(Meteor.bindEnvironment(function(error, events){
				var assetsTypes = [];
				if(!error) {
					for(var count = 0; count < events.length; count++) {
						if(events[count].event === "bulkAssetTypeCreated") {
							var jjj = 0;

							for(var iii = 0; iii < events.length; iii++) {
								if(events[iii].event === "bulkAssetsIssued") {
									if(events[iii].args.assetName === events[count].args.assetName) {
										jjj = jjj + parseInt(events[iii].args.units);
									}
								}
							}

							assetsTypes.push({assetName: events[count].args.assetName, uniqueIdentifier: events[count].args.uniqueIdentifier, authorizedIssuer: events[count].args.authorizedIssuer, type: "bulk", units: jjj})
						} else if(events[count].event === "soloAssetTypeCreated") {
							var jjj = 0;

							for(var iii = 0; iii < events.length; iii++) {
								if(events[iii].event === "soloAssetIssued") {
									if(events[iii].args.assetName === events[count].args.assetName) {
										jjj = jjj + 1;
									}
								}
							}

							assetsTypes.push({assetName: events[count].args.assetName, uniqueIdentifier: events[count].args.uniqueIdentifier, authorizedIssuer: events[count].args.authorizedIssuer, type: "solo", units: jjj})
						}
					}

					Networks.update({
						_id: item._id
					}, {
						$set: {
							assetsTypes: assetsTypes
						}
					})
				}
			}))
		})
	}, 5000)
}

function updateOrderBook() {
	Meteor.setInterval(function(){
		var nodes = Networks.find({}).fetch()
		nodes.forEach(function(item, index){
			var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
			var web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + item.rpcNodePort));
			var assetsContract = web3.eth.contract(smartContracts.assets.abi);
			var assets = assetsContract.at(item.assetsContractAddress);
			var events = assets.orderPlaced({fromBlock: 0, toBlock: "latest"});

			events.get(Meteor.bindEnvironment(function(error, events){
				var orderBook = [];
				if(!error) {
					for(var count = 0; count < events.length; count++) {
						let orderInfo = assets.getOrderInfo.call(events[count].args.orderId);
						let order_status_owner = assets.getOrderInfo_Status_Owner.call(events[count].args.orderId);

						orderBook.push({
							orderId: events[count].args.orderId,
							fromType: orderInfo[1],
							toType: orderInfo[0],
							fromId: orderInfo[3],
							toId: orderInfo[2],
							fromUnits: orderInfo[4].toString(),
							toUnits: orderInfo[5].toString(),
							fromUniqueIdentifier: orderInfo[6],
							toUniqueIdentifier: orderInfo[7],
							seller: order_status_owner[0],
							buyer: order_status_owner[1],
							status: order_status_owner[2]
						})
					}

					Networks.update({
						_id: item._id
					}, {
						$set: {
							orderBook: orderBook
						}
					})
				}
			}))
		})
	}, 5000)
}

export {updateNodeStatus, updateAuthoritiesList, unlockAccounts, updateAssetsInfo, updateOrderBook, scanBlock}
