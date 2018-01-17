import {Utilities} from "../utilities.js"

var cmd=require("node-cmd");

function updateMinikubeIP() {
	Utilities.upsert({
		name: "minikube-ip",
	}, {
		$set: {
			"value": "54.149.176.42"
		}
	});
	/*Meteor.setInterval(function(){
		cmd.get(
	        "minikube ip",
	        Meteor.bindEnvironment(function(error, data, stderr){
	        	if(!error) {
	        		var ip = data.substring(0, data.length - 1);

	        	} else {
	        		console.log(error, stderr)
	        	}
	        }
	    ));
	}, 60000)

	cmd.get(
        "minikube ip",
        Meteor.bindEnvironment(function(error, data, stderr){
        	if(!error) {
        		var ip = data.substring(0, data.length - 1);
        		Utilities.upsert({
				    name: "minikube-ip",
				}, {
				    $set: {
				        "value": ip
				    }
				});
        	} else {
        		console.log(error, stderr)
        	}
        }
    ));*/
}

export {updateMinikubeIP}
