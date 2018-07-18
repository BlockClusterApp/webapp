import { Mongo } from "meteor/mongo";
import SimpleSchema from "simpl-schema";

import AttachBaseHooks from "../../modules/helpers/server/model-helpers";

const UserInvitationCollection = new Mongo.Collection("userInvitation");

AttachBaseHooks(UserInvitationCollection);

UserInvitationCollection.schema = new SimpleSchema({
  inviteFrom: {
    type: String
  },
  inviteTo: {
    type: String
  },
  networkId: {
    type: String
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  uniqueToken: {
    type: String
  },
  active: {
    type: Boolean
  },
  inviteAcceptedAt: {
    type: Date
  }
});

export const UserInvitation = UserInvitationCollection;
