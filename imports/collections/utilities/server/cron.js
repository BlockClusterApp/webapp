import { Utilities } from "../utilities.js";
import Config from "../../../modules/config/server";

//var cmd = require("node-cmd");

function updateWorkerNodeIP() {
  Utilities.upsert(
    {
      name: "workerNodeIP"
    },
    {
      $set: {
        value: Config.workerNodeIP
      }
    }
  );
}

function updateWorkerNodeDomainName() {
  Utilities.upsert(
    {
      name: "workerNodeDomainName"
    },
    {
      $set: {
        value: Config.workderNodeDomainName
      }
    }
  );
}

function updateKuberREST_IP() {
  Utilities.upsert(
    {
      name: "kuberREST_IP"
    },
    {
      $set: {
        value: Config.kubeRestApiHost
      }
    }
  );
}

function updateFirewall_Port() {
  Utilities.upsert(
    {
      name: "firewall_Port"
    },
    {
      $set: {
        value: Config.firewallPort
      }
    }
  );
}

function updateRedis_Info() {
  Utilities.upsert(
    {
      name: "redis"
    },
    {
      $set: {
        ip: Config.redisHost,
        port: Config.redisPort
      }
    }
  );
}

export {
  updateWorkerNodeIP,
  updateKuberREST_IP,
  updateFirewall_Port,
  updateRedis_Info,
  updateWorkerNodeDomainName
};
