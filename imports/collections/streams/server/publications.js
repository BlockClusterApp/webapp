import {Streams} from "../streams.js"

Meteor.publish("streams", function (instanceId) {
	return Streams.find({instanceId: instanceId});
});
