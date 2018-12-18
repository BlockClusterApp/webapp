import {Paymeter} from "../paymeter.js"
Meteor.publish("paymeter_user_data", function () {
	return Paymeter.find({userId: this.userId});
});
