require("../imports/startup/server/")
import {Networks} from "../imports/collections/networks/networks.js"
import {Utilities} from "../imports/collections/utilities/utilities.js"
var Future = Npm.require("fibers/future");
var lightwallet = Npm.require("eth-lightwallet");
import Web3 from "web3";
var jsonminify = require("jsonminify");
import helpers from "../imports/modules/helpers"
import smartContracts from "../imports/modules/smart-contracts"

Meteor.methods({
	"createNetwork": function(networkName){
		var myFuture = new Future();
		var kuberREST_IP = Utilities.find({"name": "kuberREST_IP"}).fetch()[0].value;
		var instanceId = helpers.instanceIDGenerate();

		function deleteNetwork(id) {
			HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/deployments/` + instanceId, function(error, response){});
			HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services/` + instanceId, function(error, response){});
			HTTP.call("GET", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/replicasets?labelSelector=app%3D` + encodeURIComponent("quorum-node-" + instanceId), function(error, response){
				if(!error) {
					if(JSON.parse(response.content).items.length > 0) {
						HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/replicasets/` + JSON.parse(response.content).items[0].metadata.name, function(error, response){
							HTTP.call("GET", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/pods?labelSelector=app%3D` + encodeURIComponent("quorum-node-" + instanceId), function(error, response){
								if(!error) {
									if(JSON.parse(response.content).items.length > 0) {
										HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/pods/` + JSON.parse(response.content).items[0].metadata.name, function(error, response){})
									}
								}
							})
						})
					}
				}
			})

			Networks.remove({_id: id});
		}

		Networks.insert({
			"instanceId": instanceId,
			"name": networkName,
			"type": "new",
			"status": "initializing",
			"peerType": "authority",
			"user": this.userId,
			"createdOn": Date.now(),
			"totalENodes": [],
			"totalConstellationNodes": []
		}, function(error, id){
			if(error) {
				console.log(error);
				myFuture.throw("An unknown error occured");
			} else {
				HTTP.call("POST", `http://${kuberREST_IP}:8000/apis/apps/v1beta1/namespaces/default/deployments`, {
					"content": `apiVersion: apps/v1beta1
kind: Deployment
metadata:
  name: ${instanceId}
spec:
  replicas: 1
  revisionHistoryLimit: 10
  template:
    metadata:
      labels:
        app: quorum-node-${instanceId}
    spec:
      containers:
      - name: quorum
        image: 402432300121.dkr.ecr.us-west-2.amazonaws.com/quorum
        command: [ 'bin/bash', '-c', './setup.sh' ]
        imagePullPolicy: Always
        ports:
        - containerPort: 8545
        - containerPort: 23000
        - containerPort: 9001
        - containerPort: 6382
      imagePullSecrets:
      - name: regsecret`,
					"headers": {
						"Content-Type": "application/yaml"
					}
				}, function(error, response) {
					if(error) {
						console.log(error);
						deleteNetwork(id)
					} else {
						HTTP.call("POST", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services`, {
							"content": `kind: Service
apiVersion: v1
metadata:
  name: ${instanceId}
spec:
  ports:
    - name: rpc
      port: 8545
    - name: constellation
      port: 9001
    - name: eth
      port: 23000
    - name: readfile
      port: 6382
  selector:
      app: quorum-node-${instanceId}
  type: NodePort`,
  							"headers": {
  								"Content-Type": "application/yaml"
  							}
						}, function(error, response){
							if(error) {
								console.log(error);
								deleteNetwork(id)
							} else {
								HTTP.call("GET", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services/` + instanceId, {}, function(error, response){
									if(error) {
										console.log(error);
										deleteNetwork(id)
									} else {
										let rpcNodePort = response.data.spec.ports[0].nodePort
										Networks.update({
											_id: id
										}, {
											$set: {
												rpcNodePort: response.data.spec.ports[0].nodePort,
												constellationNodePort: response.data.spec.ports[1].nodePort,
												ethNodePort: response.data.spec.ports[2].nodePort,
												readFile: response.data.spec.ports[3].nodePort,
												clusterIP: response.data.spec.clusterIP,
												realRPCNodePort: 8545,
												realConstellationNodePort: 9001,
												realEthNodePort: 23000
											}
										})

										myFuture.return();

										var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;

										Meteor.setTimeout(() => {
											HTTP.call("GET", `http://` + workerNodeIP + ":" + response.data.spec.ports[3].nodePort, function(error, response){
												if(error) {
													console.log(error);
													deleteNetwork(id)
												} else {
													var data = JSON.parse(response.content);
													Networks.update({
														_id: id
													}, {
														$set: {
															genesisBlock: data.genesis,
															nodeKey: data.nodekey,
															nodeEthAddress: "0x" + lightwallet.keystore._computeAddressFromPrivKey(data.nodekey),
															constellationPubKey: data.constellationPublicKey
														}
													})

													let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + rpcNodePort));
													web3.currentProvider.sendAsync({
											            method: "admin_nodeInfo",
											            params: [],
											            jsonrpc: "2.0",
											            id: new Date().getTime()
											        }, Meteor.bindEnvironment(function(error, result) {
											            if(error) {
															console.log(error);
											            	deleteNetwork(id)
											            } else {
											            	Networks.update({
																_id: id
															}, {
																$set: {
																	nodeId: result.result.id,
																}
															})

															web3.currentProvider.sendAsync({
															    method: "istanbul_getValidators",
															    params: [],
															    jsonrpc: "2.0",
															    id: new Date().getTime()
															}, Meteor.bindEnvironment(function(error, result) {
																if(error) {
																	console.log(error);
																	deleteNetwork(id)
																} else {
																	Networks.update({
																		_id: id
																	}, {
																		$set: {
																			currentValidators: result.result
																		}
																	})

																	web3.currentProvider.sendAsync({
																		method: "personal_newAccount",
																		params: [""],
																		jsonrpc: "2.0",
																		id: new Date().getTime()
																	}, Meteor.bindEnvironment(function(error, result) {
																		if(error) {
																			console.log(error);
																			deleteNetwork(id)
																		} else {
																			let accountsPassword = {};
																			let accounts = [];
																			accountsPassword[result.result] = ""
																			accounts.push(result.result);
																			Networks.update({
																				_id: id
																			}, {
																				$set: {
																					accountsPassword: {accountsPassword},
																					accounts: accounts
																				}
																			})

																			web3.currentProvider.sendAsync({
																			    method: "personal_unlockAccount",
																			    params: [result.result, "", 0],
																			    jsonrpc: "2.0",
																			    id: new Date().getTime()
																			}, Meteor.bindEnvironment(function(error, result) {
																				if(error) {
																					console.log(error);
																					deleteNetwork(id)
																				} else {
																					var assetsContract = web3.eth.contract(smartContracts.assets.abi);
																					var assets = assetsContract.new({
																						from: web3.eth.accounts[0],
																						data: smartContracts.assets.bytecode,
																						gas: '4700000'
																					}, Meteor.bindEnvironment(function(error, contract){
																						if(error) {
																							console.log(error);
																							deleteNetwork(id)
																						} else {
																							if (typeof contract.address !== 'undefined') {
																								Networks.update({
																									_id: id
																								}, {
																									$set: {
																										"status": "running",
																										"assetsContractAddress": contract.address
																									}
																								})
																							}
																						}
																					}))
																				}
																			}))
																		}
																	}))
																}
															}))
											            }
											        }))
												}
											})
										}, 15000)
									}
								})
							}
						})
					}
				});
			}
		})

		return myFuture.wait();
	},
	"deleteNetwork": function(id){
		var myFuture = new Future();
		var kuberREST_IP = Utilities.find({"name": "kuberREST_IP"}).fetch()[0].value;

		HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/deployments/` + id, function(error, response){
			if(error) {
				console.log(error);
				myFuture.throw("An unknown error occured");
			} else {
				HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services/` + id, function(error, response){
					if(error) {
						console.log(error);
						myFuture.throw("An unknown error occured");
					} else {
						HTTP.call("GET", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/replicasets?labelSelector=app%3D` + encodeURIComponent("quorum-node-" + id), function(error, response){
							if(error) {
								console.log(error);
								myFuture.throw("An unknown error occured");
							} else {
								HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/replicasets/` + JSON.parse(response.content).items[0].metadata.name, function(error, response){
									if(error) {
										console.log(error);
										myFuture.throw("An unknown error occured");
									} else {
										HTTP.call("GET", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/pods?labelSelector=app%3D` + encodeURIComponent("quorum-node-" + id), function(error, response){
											if(error) {
												console.log(error);
												myFuture.throw("An unknown error occured");
											} else {
												HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/pods/` + JSON.parse(response.content).items[0].metadata.name, function(error, response){
													if(error) {
														console.log(error);
														myFuture.throw("An unknown error occured");
													} else {
														Networks.remove({instanceId: id});
														myFuture.return();
													}
												})
											}
										})
									}
								})
							}
						})
					}
				})
			}
		})

		return myFuture.wait();
	},
	"joinNetwork": function(networkName, nodeType, genesisFileContent, totalENodes, totalConstellationNodes, assetsContractAddress, userId) {
		var myFuture = new Future();
		var instanceId = helpers.instanceIDGenerate();
		var kuberREST_IP = Utilities.find({"name": "kuberREST_IP"}).fetch()[0].value;

		function deleteNetwork(id) {
			HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/deployments/` + instanceId, function(error, response){});
			HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services/` + instanceId, function(error, response){});
			HTTP.call("GET", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/replicasets?labelSelector=app%3D` + encodeURIComponent("quorum-node-" + instanceId), function(error, response){
				if(!error) {
					if(JSON.parse(response.content).items.length > 0) {
						HTTP.call("DELETE", `http://${kuberREST_IP}:8000/apis/apps/v1beta2/namespaces/default/replicasets/` + JSON.parse(response.content).items[0].metadata.name, function(error, response){
							HTTP.call("GET", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/pods?labelSelector=app%3D` + encodeURIComponent("quorum-node-" + instanceId), function(error, response){
								if(!error) {
									if(JSON.parse(response.content).items.length > 0) {
										HTTP.call("DELETE", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/pods/` + JSON.parse(response.content).items[0].metadata.name, function(error, response){})
									}
								}
							})
						})
					}
				}
			})
			Networks.remove({_id: id});
		}

		Networks.insert({
			"instanceId": instanceId,
			"name": networkName,
			"type": "join",
			"status": "initializing",
			"peerType": nodeType,
			"user": userId ? userId : this.userId,
			"createdOn": Date.now(),
			"totalENodes": totalENodes,
			"totalConstellationNodes": totalConstellationNodes,
			"genesisBlock": genesisFileContent,
			"accounts": [],
			"accountsPassword": {},
			"assetsContractAddress": assetsContractAddress
		}, function(error, id){
			if(error) {
				console.log(error);
				myFuture.throw("An unknown error occured");
			} else {
				totalConstellationNodes = JSON.stringify(totalConstellationNodes).replace(/\"/g,'\\"').replace(/\"/g,'\\"').replace(/\"/g,'\\"')
				totalENodes = JSON.stringify(totalENodes).replace(/\"/g,'\\"').replace(/\"/g,'\\"').replace(/\"/g,'\\"')
				genesisFileContent = jsonminify(genesisFileContent.toString()).replace(/\"/g,'\\"')

				if(nodeType === "authority") {
					var content = `apiVersion: apps/v1beta1
kind: Deployment
metadata:
  name: ${instanceId}
spec:
  replicas: 1
  revisionHistoryLimit: 10
  template:
    metadata:
      labels:
        app: quorum-node-${instanceId}
    spec:
      containers:
      - name: quorum
        image: 402432300121.dkr.ecr.us-west-2.amazonaws.com/quorum
        command: [ "bin/bash", "-c", "./setup.sh ${totalConstellationNodes} ${totalENodes} '${genesisFileContent}'  mine" ]
        imagePullPolicy: Always
        ports:
        - containerPort: 8545
        - containerPort: 23000
        - containerPort: 9001
        - containerPort: 6382
      imagePullSecrets:
      - name: regsecret`;
				} else {
					var content = `apiVersion: apps/v1beta1
kind: Deployment
metadata:
  name: ${instanceId}
spec:
  replicas: 1
  revisionHistoryLimit: 10
  template:
    metadata:
      labels:
        app: quorum-node-${instanceId}
    spec:
      containers:
      - name: quorum
        image: 402432300121.dkr.ecr.us-west-2.amazonaws.com/quorum
        command: [ "bin/bash", "-c", "./setup.sh ${totalConstellationNodes} ${totalENodes} '${genesisFileContent}'" ]
        imagePullPolicy: Always
        ports:
        - containerPort: 8545
        - containerPort: 23000
        - containerPort: 9001
        - containerPort: 6382
      imagePullSecrets:
      - name: regsecret`;
				}

				HTTP.call("POST", `http://${kuberREST_IP}:8000/apis/apps/v1beta1/namespaces/default/deployments`, {
					"content": content,
					"headers": {
						"Content-Type": "application/yaml"
					}
				}, function(error, response) {
					if(error) {
						console.log(error);
						deleteNetwork(id)
					} else {
						HTTP.call("POST", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services`, {
							"content": `kind: Service
apiVersion: v1
metadata:
  name: ${instanceId}
spec:
  ports:
    - name: rpc
      port: 8545
    - name: constellation
      port: 9001
    - name: eth
      port: 23000
    - name: readfile
      port: 6382
  selector:
      app: quorum-node-${instanceId}
  type: NodePort`,
  							"headers": {
  								"Content-Type": "application/yaml"
  							}
						}, function(error, response){
							if(error) {
								console.log(error);
								deleteNetwork(id)
							} else {
								HTTP.call("GET", `http://${kuberREST_IP}:8000/api/v1/namespaces/default/services/` + instanceId, {}, function(error, response){
									if(error) {
										console.log(error);
										deleteNetwork(id)
									} else {
										let rpcNodePort = response.data.spec.ports[0].nodePort
										Networks.update({
											_id: id
										}, {
											$set: {
												rpcNodePort: response.data.spec.ports[0].nodePort,
												constellationNodePort: response.data.spec.ports[1].nodePort,
												ethNodePort: response.data.spec.ports[2].nodePort,
												readFile: response.data.spec.ports[3].nodePort,
												clusterIP: response.data.spec.clusterIP,
												realRPCNodePort: 8545,
												realConstellationNodePort: 9001,
												realEthNodePort: 23000
											}
										})

										myFuture.return();

										var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;

										Meteor.setTimeout(() => {
											HTTP.call("GET", "http://" + workerNodeIP + ":" + response.data.spec.ports[3].nodePort, function(error, response){
												if(error) {
													console.log(error);
													deleteNetwork(id)
												} else {
													var data = JSON.parse(response.content);
													Networks.update({
														_id: id
													}, {
														$set: {
															nodeKey: data.nodekey,
															nodeEthAddress: "0x" + lightwallet.keystore._computeAddressFromPrivKey(data.nodekey),
															constellationPubKey: data.constellationPublicKey
														}
													})

													let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + rpcNodePort));
													web3.currentProvider.sendAsync({
											            method: "admin_nodeInfo",
											            params: [],
											            jsonrpc: "2.0",
											            id: new Date().getTime()
											        }, Meteor.bindEnvironment(function(error, result) {
											            if(error) {
															console.log(error);
											            	deleteNetwork(id)
											            } else {
											            	Networks.update({
																_id: id
															}, {
																$set: {
																	nodeId: result.result.id,
																}
															})

															web3.currentProvider.sendAsync({
															    method: "istanbul_getValidators",
															    params: [],
															    jsonrpc: "2.0",
															    id: new Date().getTime()
															}, Meteor.bindEnvironment(function(error, result) {
																if(error) {
																	console.log(error);
																	deleteNetwork(id)
																} else {
																	Networks.update({
																		_id: id
																	}, {
																		$set: {
																			currentValidators: result.result,
																			"status": "running"
																		}
																	})
																}
															}))
											            }
											        }))
												}
											})
										}, 15000)
									}
								})
							}
						})
					}
				});
			}
		})

		return myFuture.wait();
	},
	"vote": function(networkId, toVote){
		var myFuture = new Future();
		var network = Networks.find({_id: networkId}).fetch()[0];
		var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
		let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));
		web3.currentProvider.sendAsync({
		    method: "istanbul_propose",
		    params: [toVote, true],
		    jsonrpc: "2.0",
		    id: new Date().getTime()
		}, Meteor.bindEnvironment(function(error, result) {
			if(error) {
				console.log(error);
				myFuture.throw("An unknown error occured");
			} else {
				myFuture.return();
			}
		}))

		return myFuture.wait();
	},
	"unVote": function(networkId, toVote){
		var myFuture = new Future();
		var network = Networks.find({_id: networkId}).fetch()[0];
		var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
		let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));
		web3.currentProvider.sendAsync({
		    method: "istanbul_propose",
		    params: [toVote, false],
		    jsonrpc: "2.0",
		    id: new Date().getTime()
		}, Meteor.bindEnvironment(function(error, result) {
			if(error) {
				console.log(error);
				myFuture.throw("An unknown error occured");
			} else {
				myFuture.return();
			}
		}))

		return myFuture.wait();
	},
	"createAccount": function(password, networkId){
		var myFuture = new Future();
		var network = Networks.find({_id: networkId}).fetch()[0];
		var accountsPassword = network.accountsPassword;
		var accounts = network.accounts;
		var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
		let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));
		web3.currentProvider.sendAsync({
		    method: "personal_newAccount",
		    params: [password],
		    jsonrpc: "2.0",
		    id: new Date().getTime()
		}, Meteor.bindEnvironment(function(error, result) {
			if(error) {
				console.log(error);
				myFuture.throw("An unknown error occured");
			} else {
				accountsPassword[result.result] = password
				accounts.push(result.result);
				Networks.update({
					_id: networkId
				}, {
					$set: {
						accountsPassword: accountsPassword,
						accounts: accounts
					}
				})
				myFuture.return();
			}
		}))

		return myFuture.wait();
	},
	"inviteUserToNetwork": function(networkId, nodeType, email){
		let user = Accounts.findUserByEmail(email);
		var network = Networks.find({_id: networkId}).fetch()[0];
		if(user) {
			Meteor.call(
				"joinNetwork",
				network.name,
				nodeType,
				network.genesisBlock.toString(),
				["enode://" + network.nodeId + "@" + network.clusterIP + ":" + network.realEthNodePort].concat(network.totalENodes),
				[network.clusterIP + ":" + network.realConstellationNodePort].concat(network.totalConstellationNodes),
				network.assetsContractAddress,
				user._id
			)
		} else {
			throw new Meteor.Error(500, 'Unknown error occured');
		}
	},
	"createAssetType": function(instanceId, assetName, assetType, assetIssuer, reissuable){
		var myFuture = new Future();
		var network = Networks.find({instanceId: instanceId}).fetch()[0];
		var accounts = network.accounts;
		var workerNodeIP = Utilities.find({"name": "workerNodeIP"}).fetch()[0].value;
		let web3 = new Web3(new Web3.providers.HttpProvider("http://" + workerNodeIP + ":" + network.rpcNodePort));

		var assetsContract = web3.eth.contract(smartContracts.assets.abi);
		var assets = assetsContract.at(network.assetsContractAddress);

		if(assetType === "solo") {
			assets.createSoloAssetType.sendTransaction(assetName, {
				from: assetIssuer,
				gas: '4700000'
			}, function(error, txnHash){
				if(!error) {
					myFuture.return();
				} else {
					myFuture.throw("An unknown error occured");
				}
			})
		} else {
			assets.createBulkAssetType.sendTransaction(assetName, (reissuable === "true"), {
				from: assetIssuer,
				gas: '4700000'
			}, function(error, txnHash){
				if(!error) {
					myFuture.return();
				} else {
					myFuture.throw("An unknown error occured");
				}
			})
		}

		return myFuture.wait();
	}
})

//Networks.remove({})
