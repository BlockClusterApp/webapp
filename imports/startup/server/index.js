import {Networks} from "../../collections/networks/networks.js"
import {Utilities} from "../../collections/utilities/utilities.js"

require("../../collections/networks/server/publications.js")
require("../../collections/utilities/server/publications.js")
require("../../api/assets.js")

import {updateWorkerNodeIP, updateKuberREST_IP} from "../../collections/utilities/server/cron.js"
import {updateNodeStatus, updateAuthoritiesList, unlockAccounts, updateAssetsInfo, updateOrderBook, scanBlock} from "../../collections/networks/server/cron.js"

updateWorkerNodeIP()
updateKuberREST_IP()
updateNodeStatus()
updateAuthoritiesList()
unlockAccounts()
updateAssetsInfo();
updateOrderBook();
scanBlock();

export {}
