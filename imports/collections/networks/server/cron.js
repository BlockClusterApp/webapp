import Web3 from "web3";
import {Networks} from "../networks.js"
import {Orders} from "../../orders/orders.js"
import {SoloAssets} from "../../soloAssets/soloAssets.js"
import {Utilities} from "../../utilities/utilities.js"
import smartContracts from "../../../modules/smart-contracts"
var MongoClient = require("mongodb").MongoClient;
var db = null;

MongoClient.connect("mongodb://localhost:3001", function(err, database) {
    db = database.db("meteor");
});


function nodeStatusCronJob (instanceId) {
	var kuberREST_IP = Utilities.find({"name": "kuberREST_IP"}).fetch()[0].value;
	HTTP.call("GET", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/deployments/` + instanceId, function(error, response){
		if(error) {
			Networks.update({
				instanceId: instanceId
			}, {
				$set: {
					"status": "down"
				}
			})
		} else {
			if(response.data.status.availableReplicas === 1) {
				Networks.update({
					instanceId: instanceId
				}, {
					$set: {
						"status": "running"
					}
				})
			} else {
				Networks.update({
					instanceId: instanceId
				}, {
					$set: {
						"status": "down"
					}
				})
			}
		}
	})
}

function updateNodeStatus() {
	var nodes = Networks.find({}).fetch()
	nodes.forEach(function(item, index){
		if(item.status !== "initializing") {
			SyncedCron.add({
				name: "status-" + item.instanceId,
			  	schedule: function(parser) {
			    	return parser.text("every 5 seconds");
			  	},
			  	job: () => {
					nodeStatusCronJob(item.instanceId)
			  	}
			});
		}
	})
}

function authoritiesListCronJob (_id, rpcNodePort) {
	var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
	let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + rpcNodePort));
	web3.currentProvider.sendAsync({
		method: "istanbul_getValidators",
		params: [],
		jsonrpc: "2.0",
		id: new Date().getTime()
	}, Meteor.bindEnvironment(function(error, result) {
		if(!error) {
			Networks.update({
				_id: _id
			}, {
				$set: {
					currentValidators: result.result
				}
			})
		}
	}))
}

function updateAuthoritiesList() {
	var nodes = Networks.find({}).fetch()
	nodes.forEach(function(item, index){
		if(item.currentValidators !== undefined) {
			SyncedCron.add({
				name: "authoritiesList-" + item.instanceId,
			  	schedule: function(parser) {
			    	return parser.text("every 5 seconds");
			  	},
			  	job: () => {
					authoritiesListCronJob(item._id, item.rpcNodePort)
			  	}
			});
		}
	})
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

async function indexSoloAssets(web3, blockNumber, instanceId, assetsContractAddress) {
	return new Promise((resolve, reject) => {
		var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
		var assetsContract = web3.eth.contract(smartContracts.assets.abi);
		var assets = assetsContract.at(assetsContractAddress);
		var events = assets.allEvents({fromBlock: blockNumber, toBlock: blockNumber});
		events.get(Meteor.bindEnvironment(function(error, events){
			if(error) {
				reject(error);
			} else {
				try {
					for(let count = 0; count < events.length; count++) {
						if (events[count].event === "soloAssetIssued") {
							try {
								let number = new BigNumber(events[count].args.uniqueAssetIdentifier)

                                SoloAssets.upsert({
                                    instanceId: instanceId,
                                    assetName: events[count].args.assetName,
									uniqueIdentifier: number.toNumber()
                            	}, {
                                    $set: {
										owner: events[count].args.to,
										status: "open"
									}
                            	});
							} catch(e) {
                                SoloAssets.upsert({
                                    instanceId: instanceId,
                                    assetName: events[count].args.assetName,
									uniqueIdentifier: events[count].args.uniqueAssetIdentifier
                            	}, {
                                    $set: {
                                        owner: events[count].args.to,
										status: "open"
									}
                            	});
							}
						} else if (events[count].event === "addedOrUpdatedSoloAssetExtraData") {
							try {
								var uniqueAssetIdentifierValue = new BigNumber(events[count].args.uniqueAssetIdentifier)
								uniqueAssetIdentifierValue = uniqueAssetIdentifierValue.toNumber()
							} catch(e) {
								uniqueAssetIdentifierValue = events[count].args.uniqueAssetIdentifier
							}

							try {
								let number = new BigNumber(events[count].args.value)
                                SoloAssets.upsert({
                                    instanceId: instanceId,
                                    assetName: events[count].args.assetName,
									uniqueIdentifier: uniqueAssetIdentifierValue
                            	}, {
                                    $set: {
										[events[count].args.key]: number.toNumber()
									}
                            	});
							}
							catch(e){
                                SoloAssets.upsert({
                                    instanceId: instanceId,
                                    assetName: events[count].args.assetName,
									uniqueIdentifier: uniqueAssetIdentifierValue
                            	}, {
                                    $set: {
										[events[count].args.key]: events[count].args.value
									}
                            	});
							}
						} else if (events[count].event === "transferredOwnershipOfSoloAsset") {
							try {
								var uniqueAssetIdentifierValue = new BigNumber(events[count].args.uniqueAssetIdentifier)
								uniqueAssetIdentifierValue = uniqueAssetIdentifierValue.toNumber()
							} catch(e) {
								uniqueAssetIdentifierValue = events[count].args.uniqueAssetIdentifier
							}

                            SoloAssets.upsert({
                                instanceId: instanceId,
                                assetName: events[count].args.assetName,
								uniqueIdentifier: uniqueAssetIdentifierValue
                            }, {
                                $set: {
									owner: events[count].args.to
								}
                            });
						} else if(events[count].event === "closedSoloAsset") {
							try {
								var uniqueAssetIdentifierValue = new BigNumber(events[count].args.uniqueAssetIdentifier)
								uniqueAssetIdentifierValue = uniqueAssetIdentifierValue.toNumber()
							} catch(e) {
								uniqueAssetIdentifierValue = events[count].args.uniqueAssetIdentifier
							}

                            SoloAssets.upsert({
                                instanceId: instanceId,
                                assetName: events[count].args.assetName,
								uniqueIdentifier: uniqueAssetIdentifierValue
                            }, {
                                $set: {
									status: "closed"
								}
                            });
						}
					}
					resolve();
				} catch(e) {
					reject(e)
				}
			}
		}))
	});
}

async function indexAssets(web3, blockNumber, instanceId, assetsContractAddress) {
	return new Promise((resolve, reject) => {
		var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
		var assetsContract = web3.eth.contract(smartContracts.assets.abi);
		var assets = assetsContract.at(assetsContractAddress);
		var events = assets.allEvents({fromBlock: blockNumber, toBlock: blockNumber});
		events.get(Meteor.bindEnvironment(function(error, events){
			if(error) {
				reject(error);
			} else {
				try {
                    var assetsTypes = [];
                    var nodes = Networks.find({instanceId: instanceId}).fetch();
                    assetsTypes = nodes[0].assetsTypes || {};
					for(let count = 0; count < events.length; count++) {
						if (events[count].event === "bulkAssetTypeCreated") {
							assetsTypes[events[count].args.assetName] = {assetName: events[count].args.assetName, uniqueIdentifier: events[count].args.uniqueIdentifier, authorizedIssuer: events[count].args.authorizedIssuer, type: "bulk", units: 0}
                        } else if (events[count].event === "bulkAssetsIssued") {
							let number = new BigNumber(events[count].args.units)
                            assetsTypes[events[count].args.assetName].units += number.toNumber()
						} else if (events[count].event === "soloAssetTypeCreated") {
							assetsTypes[events[count].args.assetName] = {assetName: events[count].args.assetName, uniqueIdentifier: events[count].args.uniqueIdentifier, authorizedIssuer: events[count].args.authorizedIssuer, type: "solo", units: 0}
						} else if (events[count].event === "soloAssetIssued") {
                            assetsTypes[events[count].args.assetName].units += 1
						}
					}
					resolve(assetsTypes);
				} catch(e) {
					reject(e)
				}
			}
		}))
	});
}

async function indexOrders(web3, blockNumber, instanceId, assetsContractAddress) {
	return new Promise((resolve, reject) => {
		var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
		var assetsContract = web3.eth.contract(smartContracts.assets.abi);
		var assets = assetsContract.at(assetsContractAddress);
		var events = assets.allEvents({fromBlock: blockNumber, toBlock: blockNumber});
		events.get(Meteor.bindEnvironment(function(error, events){
			if(error) {
				reject(error);
			} else {
				try {
					for(let count = 0; count < events.length; count++) {
						if (events[count].event === "orderPlaced" || events[count].event === "orderFulfilled" || events[count].event === "orderCancelled") {
                            let orderInfo = assets.getOrderInfo.call(events[count].args.orderId);
							let order_status_owner = assets.getOrderInfo_Status_Owner.call(events[count].args.orderId);

                            Orders.upsert({
                                instanceId: instanceId,
                        		orderId: events[count].args.orderId
                        	}, {
                        		$set: {
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
                        		}
                        	});
                        }
					}

					resolve();
				} catch(e) {
					reject(e)
				}
			}
		}))
	});
}

function scanBlocksOfNode(instanceId) {
	let scan = async () => {
		var nodes = Networks.find({instanceId: instanceId}).fetch()

		let blockToScan = (nodes[0].blockToScan ? nodes[0].blockToScan : 0);
		let totalSmartContracts = (nodes[0].totalSmartContracts ? nodes[0].totalSmartContracts : 0);
		var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
		let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + nodes[0].rpcNodePort));
		try {
			totalSmartContracts = await updateTotalSmartContracts(web3, blockToScan, totalSmartContracts)

			if(nodes[0].assetsContractAddress !== '') {
				assetsTypes = await indexAssets(web3, blockToScan, nodes[0].instanceId, nodes[0].assetsContractAddress)
				await indexSoloAssets(web3, blockToScan, nodes[0].instanceId + "_soloAssets", nodes[0].assetsContractAddress)
                await indexOrders(web3, blockToScan, nodes[0].instanceId, nodes[0].assetsContractAddress)
			}

			Networks.update({
				_id: nodes[0]._id
			}, {
				$set: {
					blockToScan: blockToScan + 1,
					totalSmartContracts: totalSmartContracts,
                    assetsTypes: assetsTypes
				}
			})
		} catch(e) {
			console.log(e)
		}


		if(nodes.length === 1) {
			Meteor.setTimeout(scan, 100)
		}
	}

	Meteor.setTimeout(scan, 100)
}

function scanBlocksOfAllNodes() {
	let interval = Meteor.setInterval(() => {
		if(db != null) {
			db.collection("networks").find({}).toArray(Meteor.bindEnvironment((e, nodes) => {
				for(let count = 0; count < nodes.length; count++) {
					SyncedCron.add({
						name: "scanBlocks-" + nodes[count].instanceId,
						schedule: function(parser) {
							let time = new Date(Date.now() + 2000);
							return parser.recur().on(time).fullDate();
						},
						job: () => {
							scanBlocksOfNode(nodes[count].instanceId)
						}
					});
				}
			}))

			Meteor.clearInterval(interval);
		}

	}, 1000)
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

export {updateNodeStatus, updateAuthoritiesList, unlockAccounts, scanBlocksOfNode, scanBlocksOfAllNodes, nodeStatusCronJob, authoritiesListCronJob}
