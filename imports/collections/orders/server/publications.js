import {Orders} from "../orders.js"

Meteor.publish("orders", function (instanceId) {
	return Orders.find({instanceId: instanceId});
});
