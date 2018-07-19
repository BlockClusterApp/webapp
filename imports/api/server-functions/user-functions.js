import {
  generateRandomString,
  generateCompleteURLForUserInvite,
  getEJSTemplate
} from "../../modules/helpers/server";
import { UserInvitation } from "../../collections/user-invitation";
import { sendEmail } from "../emails/email-sender";
import { Networks } from '../../collections/networks/networks';

const NetworkInvitation = {};

NetworkInvitation.inviteUserToNetwork = async function(
  networkId,
  nodeType,
  email,
  userId
) {
  const network = Networks.find({
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

  // if (invitingUser.emails.map(e => e.address).includes(email)) {
  //   throw new Error("Cannot invite yourself to the network");
  // }

  let invitedUser = Meteor.users.find({
    "emails.address": email
  }).fetch()[0];


  if (!invitedUser) {
    const createdId = Accounts.createUser({
      email,
      password: `a-${new Date().getTime()}`,
      toBeCreated: true,
      profile: {

      }
    });
    invitedUser = Meteor.users.find({
      _id: createdId
    }).fetch()[0];
  }


  const uniqueString = generateRandomString(
    `${email}-${networkId}-${new Date().toString()}`
  );
  const joinNetworkLink = generateCompleteURLForUserInvite(uniqueString);

  const Template = await getEJSTemplate({ fileName: "invite-user.ejs" });
  const emailHtml = Template({
    network,
    invitingUser,
    networkJoinLink: joinNetworkLink
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
    networkId: network._id,
    metadata: {
      inviteFrom: {
        name: `${invitingUser.profile.firstName} ${invitingUser.profile.lastName}`,
        email: invitingUser.emails[0].address
      },
      inviteTo: {
        email,
        name: invitedUser.profile.firstName ? `${invitedUser.profile.firstName} ${invitedUser.profile.lastName}` : undefined
      },
      network: {
        name: network.name,
        locationCode: network.locationCode
      }
    }
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
  const network = Networks.find({
    _id: invitation.networkId
  }).fetch()[0];
  return { invitation, invitedUser, invitingUser, network };
};

Meteor.methods({
  verifyInvitationLink: NetworkInvitation.verifyInvitationLink
});

export default NetworkInvitation;
