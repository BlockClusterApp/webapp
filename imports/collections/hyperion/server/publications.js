import {Hyperion} from "../hyperion.js"

Meteor.publish("hyperion", function () {
	return Hyperion.find({user: this.userId});
});
