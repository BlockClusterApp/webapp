import {BCAccounts} from "../bcAccounts.js"

Meteor.publish("bcAccounts", function (instanceId) {
	return BCAccounts.find({instanceId: instanceId});
});
