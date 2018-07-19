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

NetworkInvitation.acceptInvitation = function(invitationId, locationCode) {
  return new Promise((resolve, reject) => {
    const invitation = UserInvitation.find({
      _id: invitationId
    }).fetch()[0];
  
    const network = Networks.find({
      _id: invitation.networkId
    }).fetch()[0];
  
    console.log("Joining network", invitationId, network);
    Meteor.call("joinNetwork", 
      network.name,
      invitation.nodeType || "authority",
      network.genesisBlock.toString(),
      ["enode://" + network.nodeId + "@" + network.workerNodeIP + ":" + network.ethNodePort].concat(network.totalENodes),
      [network.workerNodeIP + ":" + network.constellationNodePort].concat(network.totalConstellationNodes),
      network.assetsContractAddress,
      network.atomicSwapContractAddress,
      network.streamsContractAddress,
      locationCode,
      invitation.inviteTo,
      (err, res) => {
        console.log("Join network res", err, res);
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
  // let user = Accounts.findUserByEmail(email);
        // var network = Networks.find({
        //     instanceId: networkId
        // }).fetch()[0];
        // if (user) {
        //     Meteor.call(
        //         "joinNetwork",
        //         network.name,
        //         nodeType,
        //         network.genesisBlock.toString(), ["enode://" + network.nodeId + "@" + network.clusterIP + ":" + network.realEthNodePort].concat(network.totalENodes), [network.clusterIP + ":" + network.realConstellationNodePort].concat(network.totalConstellationNodes),
        //         network.assetsContractAddress,
        //         network.atomicSwapContractAddress,
        //         network.streamsContractAddress,
        //         (userId ? userId : user._id),
        //         network.locationCode
        //     )
        // } else {
        //     throw new Meteor.Error(500, 'Unknown error occured');
        // }
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

Meteor.methods({
  verifyInvitationLink: NetworkInvitation.verifyInvitationLink,
  acceptInvitation: NetworkInvitation.acceptInvitation,
  rejectInvitation: NetworkInvitation.rejectInvitation
});

export default NetworkInvitation;
