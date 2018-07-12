const defaults = require('../local.config.js');
function getAPIHost(){
    if(process.env.API_HOST) {
        return process.env.API_HOST;
    }
    switch(process.env.NODE_ENV) {
        case "production":
            return "https://app.blockcluster.io";
        case "staging":
            return "https://staging.blockcluster.io";
        case "test":
            return "https://test.blockcluster.io";
        case "dev":
            return "https://dev.blockcluster.io";
        default:
            return `http://localhost:${process.env.PORT || "3000"}`
    }
}

module.exports = {
    workerNodeIP: process.env.WORKER_NODE_IP || defaults.workerNodeIP,
    apiHost: getAPIHost(),
    workderNodeDomainName: (()=> {
        return getAPIHost().split("://")[1];
    })(),
    kubeRestApiHost: process.env.KUBE_REST_API_HOST || defaults.kubeRestApiHost,
    namespace: process.env.NAMESPACE || defaults.namespace,
    firewallPort: process.env.FIREWALL_PORT || defaults.firewallPort
}

