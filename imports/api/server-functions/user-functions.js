import {
  generateRandomString,
  generateCompleteURLForUserInvite,
  getEJSTemplate
} from "../../modules/helpers/server";
import UserInvitation from "../../collections/user-invitation";
import { sendEmail } from "../emails/email-sender";
import { Network } from '../../collections/networks/networks';

const NetworkInvitation = {};

NetworkInvitation.inviteUserToNetwork = async function(
  networkId,
  nodeType,
  email,
  userId
) {
  const network = Network.find({
    instanceId: networkId
  }).fetch()[0];
  if (!network) {
    throw new Error("Invalid network");
  }

  const invitingUser = Meteor.users
    .find({
      _id: network.user
    })
    .fetch()[0];

  if (invitingUser.emails.map(e => e.address).includes(email)) {
    throw new Error("Cannot invite yourself to the network");
  }

  let invitedUser = Meteor.users.find({
    "emails.address": email
  });

  if (!invitedUser) {
    const createdId = Accounts.createUser({
      email,
      password: `a-${new Date().getTime()}`,
      toBeCreated: true
    });
    console.log("Created User", createdId);
    invitedUser = Meteor.users.find({
      _id: createdId
    });
  }

  const uniqueString = generateRandomString(
    `${email}-${networkId}-${new Date().toString()}`
  );
  const joinNetworkLink = generateCompleteURLForUserInvite(uniqueString);

  const Template = getEJSTemplate({ fileName: "invite-user.ejs" });
  const emailHtml = Template({
    network,
    invitingUser
  });

  await sendEmail({
    from: { name: "Jason from Blockcluster", email: "jason@blockcluster.io" },
    to: email,
    subject: `Invite to join ${network.name} network on blockcluster.io`,
    text: `Visit the following link to join ${
      network.name
    } network on blockcluster.io - ${joinNetworkLink}`,
    html: emailHtml
  });

  UserInvitation.insert({
    inviteFrom: invitingUser._id,
    inviteTo: invitedUser._id,
    uniqueToken: uniqueString,
    networkId: network._id
  });

  return true;
};

NetworkInvitation.verifyInvitationLink = async function(invitationKey) {
  const invitation = UserInvitation.find({
    uniqueToken: invitationKey,
    active: true
  }).fetch()[0];

  if (!invitation) {
    return false;
  }

  const invitingUser = Meteor.users
    .find({
      _id: invitation.invitingUser
    })
    .fetch()[0];
  const invitedUser = Meteor.users
    .find({
      _id: invitation.inviteTo
    })
    .fetch()[0];
  const network = Network.find({
    _id: invitation.networkId
  }).fetch()[0];
  return { invitation, invitedUser, invitingUser, network };
};

Meteor.methods({
  verifyInvitationLink: NetworkInvitation.verifyInvitationLink
});

export default NetworkInvitation;
