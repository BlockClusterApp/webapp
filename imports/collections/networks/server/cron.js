import Web3 from "web3";
import {Networks} from "../networks.js"
import {Utilities} from "../../utilities/utilities.js"

function updateNodeStatus() {
	Meteor.setInterval(function(){
		var nodes = Networks.find({}).fetch()
		nodes.forEach(function(item, index){
			if(item.currentValidators !== undefined) {
				HTTP.call("GET", "http://127.0.0.1:8000/apis/apps/v1beta2/namespaces/default/deployments/" + item._id.toLowerCase(), function(error, response){
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
				var minikube_ip = Utilities.find({"name": "minikube-ip"}).fetch()[0].value;
				let web3 = new Web3(new Web3.providers.HttpProvider("http://" + minikube_ip + ":" + item.rpcNodePort));
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

export {updateNodeStatus, updateAuthoritiesList}