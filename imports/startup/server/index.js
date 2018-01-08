import {Networks} from "../../collections/networks/networks.js"
import {Utilities} from "../../collections/utilities/utilities.js"

require("../../collections/networks/server/publications.js")
require("../../collections/utilities/server/publications.js")

import {updateMinikubeIP} from "../../collections/utilities/server/cron.js"
import {updateNodeStatus} from "../../collections/networks/server/cron.js"

updateMinikubeIP()
updateNodeStatus()

export {Networks, Utilities}