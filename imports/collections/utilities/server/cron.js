import {Utilities} from "../utilities.js"

//var cmd = require("node-cmd");

function updateWorkerNodeIP() {
	Utilities.upsert({
		name: "workerNodeIP",
	}, {
		$set: {
			"value": "54.71.6.33"
		}
	});
}

function updateKuberREST_IP() {
	Utilities.upsert({
		name: "kuberREST_IP",
	}, {
		$set: {
			"value": "34.208.153.18"
		}
	});
}

export {updateWorkerNodeIP, updateKuberREST_IP}
