import Web3 from "web3";
import {Networks} from "../networks.js"
import {Utilities} from "../../utilities/utilities.js"

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

export {updateNodeStatus, updateAuthoritiesList, unlockAccounts}
