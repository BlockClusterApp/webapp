import {Utilities} from "../utilities"

// var cmd = require("node-cmd");

function updateWorkerNodeIP() {
	Utilities.upsert({
		name: "workerNodeIP",
	}, {
		$set: {
			"value": "52.43.83.54"
		}
	});
}

function updateWorkerNodeDomainName() {
	Utilities.upsert({
		name: "workerNodeDomainName",
	}, {
		$set: {
			"value": "app.blockcluster.io"
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

function updateFirewall_Port() {
	Utilities.upsert({
		name: "firewall_Port",
	}, {
		$set: {
			"value": "31988"
		}
	});
}

function updateRedis_Info() {
	Utilities.upsert({
		name: "redis",
	}, {
		$set: {
			"ip": "52.43.83.54",
			"port": "30296"
		}
	});
}

export {updateWorkerNodeIP, updateKuberREST_IP, updateFirewall_Port, updateRedis_Info, updateWorkerNodeDomainName}
