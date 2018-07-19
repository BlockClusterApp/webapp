import {UserInvitation} from "../index"

Meteor.publish("sentInvitations", function () {
	return UserInvitation.find({
        invitingUser: Meteor.userId()
    });
});

Meteor.publish("receivedInvitations", function() {
    return UserInvitation.find({
        inviteTo: Meteor.userId()
    });
});
