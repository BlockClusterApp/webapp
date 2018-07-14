import {Networks} from "../../collections/networks/networks.js"
import {Utilities} from "../../collections/utilities/utilities.js"

import {updateWorkerNodeIP, updateKuberREST_IP, updateFirewall_Port, updateRedis_Info, updateWorkerNodeDomainName} from "../../collections/utilities/server/cron.js"

updateWorkerNodeIP()
updateKuberREST_IP()
updateFirewall_Port()
updateRedis_Info()
updateWorkerNodeDomainName()

require("../../collections/networks/server/publications.js")
require("../../collections/utilities/server/publications.js")
require("../../collections/orders/server/publications.js")
require("../../api/assets")
require("../../api/platform")
require("../../collections/streams/server/publications.js")
require("../../collections/assetTypes/server/publications.js")
require("../../collections/bcAccounts/server/publications.js")

export {}
