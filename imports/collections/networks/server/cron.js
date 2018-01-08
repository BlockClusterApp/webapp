import Web3 from "web3";
import {Networks} from "../networks.js"

function updateNodeStatus() {
	Meteor.setInterval(function(){
		var nodes = Networks.find({}).fetch()
		nodes.forEach(function(item, index){
			if(item.nodeId !== undefined) {
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

export {updateNodeStatus}