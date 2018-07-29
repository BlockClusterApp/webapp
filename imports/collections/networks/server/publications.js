import {Networks} from "../networks.js"

Meteor.publish("networks", function () {
	return Networks.find({user: this.userId, active: true});
});
