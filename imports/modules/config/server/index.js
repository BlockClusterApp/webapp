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
    sendgridAPIKey: process.env.SENDGRID_API_KEY || defaults.sendgridApi,
    workerNodeIP: process.env.WORKER_NODE_IP || defaults.workerNodeIP,
    redisHost: process.env.REDIS_HOST || defaults.redisHost,
    redisPort: process.env.REDIS_PORT || defaults.redisPort,
    apiHost: getAPIHost(),
    workderNodeDomainName: (()=> {
        return getAPIHost().split("://")[1];
    })(),
    kubeRestApiHost: process.env.KUBE_REST_API_HOST || defaults.kubeRestApiHost,
    firewallPort: process.env.FIREWALL_PORT || defaults.firewallPort,
    namespace: process.env.NAMESPACE || defaults.namespace
}
