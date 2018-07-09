const AccountFunctions = require('./account-functions');
const AssetFunctions = require('./asset-functions');
const NetworkFunctions = require('./network-functions');
const OrderFunctions = require('./order-functions');
const StreamFunctions = require('./stream-functions');

module.exports =  {...AccountFunctions, ...AssetFunctions, ...NetworkFunctions, ...OrderFunctions, ...StreamFunctions};