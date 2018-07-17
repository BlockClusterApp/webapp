import {
  generateRandomString,
  generateCompleteURLForUserInvite,
  getEJSTemplate
} from "../../modules/helpers/server";

import { sendEmail } from "../emails/email-sender";

const inviteUserToNetwork = async function(networkId, nodeType, email, userId) {
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

  const invitedUser = Meteor.users.find({
    "emails.address": email
  });

  if (!invitedUser) {
    Accounts.createUser({
      email,
      password: `a-${new Date().getTime()}`,
      toBeCreated: true
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
    from: {name: 'Jason from Blockcluster', email: 'jason@blockcluster.io'},
    to: email,
    subject: `Invite to join ${network.name} network on blockcluster.io`,
    text: `Visit the following link to join ${network.name} network on blockcluster.io - ${joinNetworkLink}`,
    html: emailHtml
  });

  return true;
};

export { inviteUserToNetwork };
