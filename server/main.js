import {Networks, Utilities} from "../imports/startup/server/"
var Future = Npm.require("fibers/future");
var lightwallet = Npm.require("eth-lightwallet");
import Web3 from "web3";

Meteor.methods({
	"createNetwork": function(networkName){
		var myFuture = new Future();
		Networks.insert({
			"name": networkName,
			"type": "new",
			"status": "initializing",
			"peerType": "authority",
			"user": this.userId,
			"createdOn": Date.now()
		}, function(error, id){
			if(error) {
				myFuture.throw("An unknown error occured");
			} else {
				myFuture.return();
				HTTP.call("POST", "http://127.0.0.1:8000/apis/apps/v1beta1/namespaces/default/deployments", { 
					"content": `apiVersion: apps/v1beta1
kind: Deployment
metadata:
  name: ${id.toLowerCase()}
spec:
  replicas: 1
  revisionHistoryLimit: 10
  template:
    metadata:
      labels:
        app: quorum-node-${id.toLowerCase()}
    spec:
      containers:
      - name: quorum
        image: quorum:latest
        command: [ "bin/bash", "-c", "./setup.sh" ]
        imagePullPolicy: Never
        ports:
        - containerPort: 8545
        - containerPort: 2300
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
  name: ${id.toLowerCase()}
spec:
  ports:
    - name: rpc
      port: 8545
    - name: constellation
      port: 9001
    - name: eth
      port: 2300
    - name: readfile
      port: 6382
  selector:
      app: quorum-node-${id.toLowerCase()}
  type: NodePort`,
  							"headers": {
  								"Content-Type": "application/yaml"
  							}
						}, function(error, response){
							if(error) {
								Networks.remove({_id: id});
								HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + id.toLowerCase())
							} else {
								HTTP.call("GET", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + id.toLowerCase(), {}, function(error, response){
									if(error) {
										Networks.remove({_id: id});
										HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + id.toLowerCase())
										HTTP.call("DELETE", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + id.toLowerCase())
									} else {
										let rpcNodePort = response.data.spec.ports[0].nodePort
										Networks.update({
											_id: id
										}, {
											$set: {
												rpcNodePort: response.data.spec.ports[0].nodePort,
												constellationNodePort: response.data.spec.ports[1].nodePort,
												ethNodePort: response.data.spec.ports[2].nodePort,
												readFile: response.data.spec.ports[3].nodePort
											}
										})

										var minikube_ip = Utilities.find({"name": "minikube-ip"}).fetch()[0].value;

										Meteor.setTimeout(() => {
											HTTP.call("GET", "http://" + minikube_ip + ":" + response.data.spec.ports[3].nodePort, function(error, response){
												if(error) {
													Networks.remove({_id: id});
													HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + id.toLowerCase())
													HTTP.call("DELETE", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + id.toLowerCase())
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
															HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + id.toLowerCase())
															HTTP.call("DELETE", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + id.toLowerCase())
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
		HTTP.call("DELETE", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + id.toLowerCase(), function(error, response){
			if(error) {
				myFuture.throw("An unknown error occured");
			} else {
				HTTP.call("DELETE", "http://127.0.0.1:8000/api/v1/namespaces/default/services/" + id.toLowerCase(), function(error, response){
					if(error) {
						myFuture.throw("An unknown error occured");
					} else {
						Networks.remove({_id: id});
						myFuture.return();
					}
				})
			}
		})
		
		return myFuture.wait();
	}
})

//Networks.remove({})