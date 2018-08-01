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
    instanceId: networkId,
    active: true
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
    from: { name: "Blockcluster", email: "no-reply@blockcluster.io" },
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
    nodeType,
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
      _id: invitation.inviteFrom
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

NetworkInvitation.acceptInvitation = function(invitationId, locationCode, networkConfig) {
  return new Promise((resolve, reject) => {
    const invitation = UserInvitation.find({
      _id: invitationId
    }).fetch()[0];

    const network = Networks.find({
      _id: invitation.networkId
    }).fetch()[0];

    Meteor.call("joinNetwork",
      network.name,
      invitation.nodeType || "authority",
      network.genesisBlock.toString(),
      ["enode://" + network.nodeId + "@" + network.workerNodeIP + ":" + network.ethNodePort].concat(network.totalENodes),
      [network.workerNodeIP + ":" + network.constellationNodePort].concat(network.totalConstellationNodes),
      network.impulseURL,
      network.assetsContractAddress,
      network.atomicSwapContractAddress,
      network.streamsContractAddress,
      locationCode,
      networkConfig,
      invitation.inviteTo,
      (err, res) => {
        if(err) return reject(err);
        UserInvitation.update({
          _id: invitationId,
        }, {
          $set: {
            joinedNetwork: res,
            joinedLocation: locationCode,
            invitationStatus: UserInvitation.StatusMapping.Accepted,
            inviteStatusUpdatedAt: new Date()
          }
        });
        resolve(invitationId);
      }
    );
  });
}

NetworkInvitation.rejectInvitation = async function(invitationId) {
  return UserInvitation.update({
    _id: invitationId
  }, {
    $set: {
      invitationStatus: UserInvitation.StatusMapping.Rejected,
      inviteStatusUpdatedAt: new Date()
    }
  });
}


NetworkInvitation.cancelInvitation = async function(inviteId, userId) {
  return UserInvitation.update({
    _id: inviteId,
    inviteFrom: userId
  }, {
    $set: {
      inviteStatusUpdatedAt: new Date(),
      invitationStatus: UserInvitation.StatusMapping.Cancelled,
    }
  });
}

NetworkInvitation.resendInvitation = async function(inviteId, userId) {
  const invite = UserInvitation.find({
    _id: inviteId,
    inviteFrom: userId
  }).fetch()[0];
  if(!invite){
    return false;
  }
  const invitingUser = Meteor.users
    .find({
      _id: invite.inviteFrom
    })
    .fetch()[0];
  const network = Networks.find({
    _id: invite.networkId
  }).fetch()[0];
  const uniqueString = invite.uniqueString;
  const joinNetworkLink = generateCompleteURLForUserInvite(uniqueString);

  const Template = await getEJSTemplate({ fileName: "invite-user.ejs" });
  const emailHtml = Template({
    network,
    invitingUser,
    networkJoinLink: joinNetworkLink
  });

  await sendEmail({
    from: { name: "Blockcluster", email: "no-reply@blockcluster.io" },
    to: invite.metadata.inviteTo.email,
    subject: `Invite to join ${network.name} network on blockcluster.io`,
    text: `Visit the following link to join ${
      network.name
    } network on blockcluster.io - ${joinNetworkLink}`,
    html: emailHtml
  });

  UserInvitation.update({
    _id: inviteId
  }, {
    $set: {
      invitationStatus: UserInvitation.StatusMapping.Pending
    },
    $inc: {
      resendCount: 1
    }
  });

  return true;
}


Meteor.methods({
  verifyInvitationLink: NetworkInvitation.verifyInvitationLink,
  acceptInvitation: NetworkInvitation.acceptInvitation,
  rejectInvitation: NetworkInvitation.rejectInvitation,
  "updatePasswordAndInfo": (id, password, profile) => {
    Meteor.users.update({
      _id: id
    }, {
      $set: {
        profile
      }
    });
    const user = Meteor.users.find({_id: id}).fetch()[0];
    const updateResult = Meteor.users.update({
      _id: id,
      "emails.address": user.emails[0].address
    }, {
      $set: {
        "emails.$.verified": true
      }
    });
    return Accounts.setPassword(id, password);
  },
  cancelInvitation: NetworkInvitation.cancelInvitation,
  resendInvitation: NetworkInvitation.resendInvitation
});

export default NetworkInvitation;
