import {Networks, Utilities} from "../imports/startup/server/"
var Future = Npm.require("fibers/future");
var lightwallet = Npm.require("eth-lightwallet");
import Web3 from "web3";
var jsonminify = require("jsonminify");
import helpers from "../imports/modules/helpers"

Meteor.methods({
	"createNetwork": function(networkName){
		var myFuture = new Future();
		var instanceId = helpers.instanceIDGenerate();
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
				myFuture.throw("An unknown error occured");
			} else {
				HTTP.call("POST", "http://127.0.0.1:8000/apis/apps/v1beta1/namespaces/default/deployments", {
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
        image: quorum:latest
        command: [ 'bin/bash', '-c', './setup.sh' ]
        ports:
        - containerPort: 8545
        - containerPort: 23000
        - containerPort: 9001
        - containerPort: 6382`,
					"headers": {
						"Content-Type": "application/yaml"
					}
				}, function(error, response) {
					if(error) {
						Networks.remove({_id: id});
					} else {
						HTTP.call("POST", "http://127.0.0.1:8000/api/v1/namespaces/default/services", {
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
								Networks.remove({_id: id});
								HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + instanceId)
							} else {
								HTTP.call("GET", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + instanceId, {}, function(error, response){
									if(error) {
										Networks.remove({_id: id});
										HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + instanceId)
										HTTP.call("DELETE", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + instanceId)
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

										var minikube_ip = Utilities.find({"name": "minikube-ip"}).fetch()[0].value;

										Meteor.setTimeout(() => {
											HTTP.call("GET", "http://" + minikube_ip + ":" + response.data.spec.ports[3].nodePort, function(error, response){
												if(error) {
													Networks.remove({_id: id});
													HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + instanceId)
													HTTP.call("DELETE", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + instanceId)
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

													let web3 = new Web3(new Web3.providers.HttpProvider("http://" + minikube_ip + ":" + rpcNodePort));
													web3.currentProvider.sendAsync({
											            method: "admin_nodeInfo",
											            params: [],
											            jsonrpc: "2.0",
											            id: new Date().getTime()
											        }, Meteor.bindEnvironment(function(error, result) {
											            if(error) {
											            	Networks.remove({_id: id});
															HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + instanceId)
															HTTP.call("DELETE", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + instanceId)
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
																	Networks.remove({_id: id});
																	HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + id.toLowerCase())
																	HTTP.call("DELETE", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + id.toLowerCase())
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
										}, 10000)
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
		HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + id, function(error, response){
			if(error) {
				myFuture.throw("An unknown error occured");
			} else {
				HTTP.call("DELETE", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + id, function(error, response){
					if(error) {
						myFuture.throw("An unknown error occured");
					} else {
						Networks.remove({instanceId: id});
						myFuture.return();
					}
				})
			}
		})

		return myFuture.wait();
	},
	"joinNetwork": function(networkName, nodeType, genesisFileContent, totalENodes, totalConstellationNodes, userId) {
		var myFuture = new Future();
		var instanceId = helpers.instanceIDGenerate();
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
			"genesisBlock": genesisFileContent
		}, function(error, id){
			if(error) {
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
        image: quorum:latest
        command: [ "bin/bash", "-c", "./setup.sh ${totalConstellationNodes} ${totalENodes} '${genesisFileContent}'  mine" ]
        ports:
        - containerPort: 8545
        - containerPort: 23000
        - containerPort: 9001
        - containerPort: 6382`;
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
        image: quorum:latest
        command: [ "bin/bash", "-c", "./setup.sh ${totalConstellationNodes} ${totalENodes} '${genesisFileContent}'" ]
        ports:
        - containerPort: 8545
        - containerPort: 23000
        - containerPort: 9001
        - containerPort: 6382`;
				}


				HTTP.call("POST", "http://127.0.0.1:8000/apis/apps/v1beta1/namespaces/default/deployments", {
					"content": content,
					"headers": {
						"Content-Type": "application/yaml"
					}
				}, function(error, response) {
					if(error) {
						Networks.remove({_id: id});
					} else {
						HTTP.call("POST", "http://127.0.0.1:8000/api/v1/namespaces/default/services", {
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
								Networks.remove({_id: id});
								HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + instanceId)
							} else {
								HTTP.call("GET", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + instanceId, {}, function(error, response){
									if(error) {
										Networks.remove({_id: id});
										HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + instanceId)
										HTTP.call("DELETE", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + instanceId)
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

										var minikube_ip = Utilities.find({"name": "minikube-ip"}).fetch()[0].value;

										Meteor.setTimeout(() => {
											HTTP.call("GET", "http://" + minikube_ip + ":" + response.data.spec.ports[3].nodePort, function(error, response){
												if(error) {
													Networks.remove({_id: id});
													HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + instanceId)
													HTTP.call("DELETE", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + instanceId)
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

													let web3 = new Web3(new Web3.providers.HttpProvider("http://" + minikube_ip + ":" + rpcNodePort));
													web3.currentProvider.sendAsync({
											            method: "admin_nodeInfo",
											            params: [],
											            jsonrpc: "2.0",
											            id: new Date().getTime()
											        }, Meteor.bindEnvironment(function(error, result) {
											            if(error) {
											            	Networks.remove({_id: id});
															HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + instanceId)
															HTTP.call("DELETE", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + instanceId)
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
																	Networks.remove({_id: id});
																	HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + instanceId)
																	HTTP.call("DELETE", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + instanceId)
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
		var minikube_ip = Utilities.find({"name": "minikube-ip"}).fetch()[0].value;
		let web3 = new Web3(new Web3.providers.HttpProvider("http://" + minikube_ip + ":" + network.rpcNodePort));
		web3.currentProvider.sendAsync({
		    method: "istanbul_propose",
		    params: [toVote, true],
		    jsonrpc: "2.0",
		    id: new Date().getTime()
		}, Meteor.bindEnvironment(function(error, result) {
			if(error) {
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
		var minikube_ip = Utilities.find({"name": "minikube-ip"}).fetch()[0].value;
		let web3 = new Web3(new Web3.providers.HttpProvider("http://" + minikube_ip + ":" + network.rpcNodePort));
		web3.currentProvider.sendAsync({
		    method: "istanbul_propose",
		    params: [toVote, false],
		    jsonrpc: "2.0",
		    id: new Date().getTime()
		}, Meteor.bindEnvironment(function(error, result) {
			if(error) {
				myFuture.throw("An unknown error occured");
			} else {
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
				user._id
			)
		} else {
			throw new Meteor.Error(500, 'Unknown error occured');
		}
	}
})

//Networks.remove({})
