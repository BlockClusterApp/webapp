import {Hyperion} from "../hyperion.js"

Meteor.publish("hyperion", function () {
	return Hyperion.find({userId: this.userId});
});
