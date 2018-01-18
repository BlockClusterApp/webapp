import {Utilities} from "../utilities.js"

var cmd=require("node-cmd");

function updateWorkerNodeIP() {
	Utilities.upsert({
		name: "workerNodeIP",
	}, {
		$set: {
			"value": "54.149.176.42"
		}
	});
}

function updateKuberREST_IP() {
	Utilities.upsert({
		name: "kuberREST_IP",
	}, {
		$set: {
			"value": "54.149.176.42"
		}
	});
}

export {updateWorkerNodeIP, updateKuberREST_IP}
