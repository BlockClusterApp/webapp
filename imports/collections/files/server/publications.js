import {Files} from "../files.js"

Meteor.publish("files", function () {
	return Files.find({user: this.userId});
});
