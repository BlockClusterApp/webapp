import { UserInvitation } from "../index";

Meteor.publish("sentInvitations", function() {
  return UserInvitation.find(
    {
      inviteFrom: Meteor.userId()
    },
    {
      fields: {
        uniqueToken: 0
      },
      sort: {
        createdAt: -1
      }
    }
  );
});

Meteor.publish("receivedInvitations", function() {
  return UserInvitation.find(
    {
      inviteTo: Meteor.userId()
    },
    {
      fields: {
        uniqueToken: 0
      },
      sort: {
        createdAt: -1
      }
    }
  );
});
