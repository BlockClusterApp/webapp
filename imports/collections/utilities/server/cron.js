import {Utilities} from "../utilities.js"

//var cmd = require("node-cmd");

function updateWorkerNodeIP() {
	Utilities.upsert({
		name: "workerNodeIP",
	}, {
		$set: {
			"value": "52.43.83.54"
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
