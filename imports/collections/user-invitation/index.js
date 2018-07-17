import { Mongo } from "meteor/mongo";
import SimpleSchema from "simpl-schema";

import AttachBaseHooks from "../../modules/helpers/server/model-helpers";

const UserInvitationCollection = new Mongo.Collection("emailVerification");

AttachBaseHooks(UserInvitationCollection);

UserInvitationCollection.schema = new SimpleSchema({
  inviteFrom: {
    type: Mongo.ObjectID
  },
  inviteTo: {
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
