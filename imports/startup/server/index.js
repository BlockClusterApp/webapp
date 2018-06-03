import {Networks} from "../../collections/networks/networks.js"
import {Utilities} from "../../collections/utilities/utilities.js"

import {updateWorkerNodeIP, updateKuberREST_IP, updateFirewall_Port, updateRedis_Info} from "../../collections/utilities/server/cron.js"

updateWorkerNodeIP()
updateKuberREST_IP()
updateFirewall_Port()
updateRedis_Info()

require("../../collections/networks/server/publications.js")
require("../../collections/utilities/server/publications.js")
require("../../collections/orders/server/publications.js")
require("../../api/assets.js")

export {}
