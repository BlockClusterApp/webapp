import {Utilities} from "../utilities.js"

Meteor.publish("utilities", function () {
	return Utilities.find({});
});