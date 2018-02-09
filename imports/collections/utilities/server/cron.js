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
			"value": "blockcluster.io"
		}
	});
}

export {updateWorkerNodeIP, updateKuberREST_IP}
