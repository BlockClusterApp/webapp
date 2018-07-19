import { Mongo } from "meteor/mongo";
import SimpleSchema from "simpl-schema";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const UserInvitationCollection = new Mongo.Collection("userInvitation");

AttachBaseHooks(UserInvitationCollection);

UserInvitationCollection.StatusMapping = {
  Pending: 1,
  Accepted: 2,
  Rejected: 3,
  Cancelled: 4
}

UserInvitationCollection.before.insert((userId, doc) => {
  doc.createdAt = Date.now();
  doc.active = true;
  doc.invitationStatus = UserInvitationCollection.StatusMapping.Pending;
});

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
  inviteStatusUpdatedAt: {
    type: Date
  },
  invitationStatus: {
    type: Number
  },
  metadata: {
    type: Object
  },
  nodeType: {
    type: String
  },
  joinedNetwork: {
    type: String
  },
  joinedLocation: {
    type: String
  }
});

export const UserInvitation = UserInvitationCollection;
