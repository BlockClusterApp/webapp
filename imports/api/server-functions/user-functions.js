import { Meteor } from "meteor/meteor";
import {
  generateRandomString,
  generateCompleteURLForUserInvite,
  getEJSTemplate
} from "../../modules/helpers/server";
import { UserInvitation } from "../../collections/user-invitation";
import { UserCards } from "../../collections/payments/user-cards";
import { sendEmail } from "../emails/email-sender";
import { Networks } from "../../collections/networks/networks";
import Config from "../../../imports/modules/config/server";
import agenda from '../../modules/schedulers/agenda';

async function sendEmails(users) {
  const ejsTemplate = await getEJSTemplate({
    fileName: "credit-card-link-reminder.ejs"
  });
  const promises = [];
  users.forEach(user => {
    const name = `${user.profile.firstName} ${user.profile.lastName}`;
    const email = user.emails[0].address;
    console.log("Sending email to ", email);
    const finalHTML = ejsTemplate({
      user: {
        email,
        name
      }
    });
    const emailProps = {
      from: { email: "no-reply@blockcluster.io", name: "Blockcluster" },
      to: email,
      subject: `Action Required | BlockCluster`,
      text: `Kindly verify your credit card to continue using your nodes`,
      html: finalHTML
    };
    promises.push(Email.sendEmail(emailProps));
  });

  await Promise.all(promises);
  return true;
}

agenda.define(
  "warning email step 1",
  Meteor.bindEnvironment((job,done) => {
    const network_id = job.attrs.data.network_id;
    const userId = job.attrs.data.userId;
    const userData = Meteor.users.find({
      userId: userId
    });
    const found_notworks = Networks.find({
      _id:network_id,
      "deletedAt": {
       "$exists": false
      }
     })[0];
     if(!found_notworks){
      job.remove(err => {
        if (!err) {
          console.log('Successfully removed job from collection');
        }else{
          console.log(err);
        }
      });
     }else{
    sendEmails(userData, { fields: { profile: 1, emails: 1 } })
      .then(sent_mails => {
        //now schedule job after 48 hours,that checks and deletes node if needed.
        agenda.schedule(
          moment().add(48, 'hours').toDate(),
          "card verification action step 2",
          {
            network_id: network_id,
            userId: userId
          }
        );
        console.log(sent_mails)
      })
      .catch(error_sending_mail => {
        console.log(error_sending_mail)
      });
    }
  })
);

agenda.define(
  "card verification action step 2",
  Meteor.bindEnvironment(job => {
    const network_id = job.attrs.data.network_id;
    const userId = job.attrs.data.userId;
    const userCard = UserCards.find({userId:userId,active:true},{fields:{_id:1}}).fetch()[0];
    const found_notworks = Networks.find({
      _id:network_id,
      "deletedAt": {
       "$exists": false
      }
     })[0];
     console.log(found_notworks)
     if(!found_notworks){
      job.remove(err => {
        if (!err) {
          console.log('Successfully removed job from collection');
        }else{
          console.log("Job removed!")
        }
      });
     }else if(!userCard || !userCard.cards || !userCard.cards.length){
      Meteor.call("deleteNetwork",network_id,(error,done)=>{
        if(error){
          //Some issue detected during deletion of node.
          console.log(error);
        }else{
          //successfully deleted node
          console.log(done);
        }
      });
    }else{
      //user credit card found & verified.
      console.log("User card found!")
    }
  })
);

agenda.define(
  "whitelist nodes",
  Meteor.bindEnvironment(job => {
    let newNode_id = job.attrs.data.newNode_id;
    let node_id = job.attrs.data.node_id;

    const network_one = Networks.find({
      _id: node_id,
      active: true
    }).fetch()[0];

    const network_two = Networks.find({
      _id: newNode_id,
      active: true
    }).fetch()[0];

    function reSchedule() {
      agenda.schedule(new Date(Date.now() + 5000), "whitelist nodes", {
        newNode_id: newNode_id,
        node_id: node_id
      });
    }

    if (network_one && network_two) {
      if (network_two.nodeId && network_two.ethNodePort) {
        HTTP.call(
          "POST",
          `http://${Config.workerNodeIP(network_one.locationCode)}:${
            network_one.apisPort
          }/utility/whitelistPeer`,
          {
            content: JSON.stringify({
              url: `enode://${network_two.nodeId}@[::]:${
                network_two.ethNodePort
              }?discport=0`
            }),
            headers: {
              "Content-Type": "application/json"
            }
          },
          (error, response) => {
            console.log(error, response);
            if (error) {
              reSchedule();
            }
          }
        );
      } else {
        reSchedule();
      }
    }
  })
);

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

  let invitedUser = Meteor.users
    .find({
      "emails.address": email
    })
    .fetch()[0];

  if (!invitedUser) {
    const createdId = Accounts.createUser({
      email,
      password: `a-${new Date().getTime()}`,
      toBeCreated: true,
      profile: {}
    });
    invitedUser = Meteor.users
      .find({
        _id: createdId
      })
      .fetch()[0];
  }

  const uniqueString = generateRandomString(
    `${email}-${networkId}-${new Date().toString()}`
  );
  const joinNetworkLink = generateCompleteURLForUserInvite(uniqueString);

  const Template = await getEJSTemplate({
    fileName: "invite-user.ejs"
  });
  const emailHtml = Template({
    network,
    invitingUser,
    networkJoinLink: joinNetworkLink
  });

  await sendEmail({
    from: {
      name: "Blockcluster",
      email: "no-reply@blockcluster.io"
    },
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
        name: `${invitingUser.profile.firstName} ${
          invitingUser.profile.lastName
        }`,
        email: invitingUser.emails[0].address
      },
      inviteTo: {
        email,
        name: invitedUser.profile.firstName
          ? `${invitedUser.profile.firstName} ${invitedUser.profile.lastName}`
          : undefined
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
  return {
    invitation,
    invitedUser,
    invitingUser,
    network
  };
};

NetworkInvitation.acceptInvitation = function(
  invitationId,
  locationCode,
  networkConfig
) {
  return new Promise((resolve, reject) => {
    const invitation = UserInvitation.find({
      _id: invitationId
    }).fetch()[0];

    const network = Networks.find({
      _id: invitation.networkId
    }).fetch()[0];

    Meteor.call(
      "joinNetwork",
      network.name,
      invitation.nodeType || "authority",
      network.genesisBlock.toString(),
      [
        "enode://" +
          network.nodeId +
          "@" +
          network.workerNodeIP +
          ":" +
          network.ethNodePort
      ].concat(network.totalENodes),
      network.impulseURL,
      network.assetsContractAddress,
      network.atomicSwapContractAddress,
      network.streamsContractAddress,
      locationCode,
      networkConfig,
      invitation.inviteTo,
      (err, res) => {
        if (err) return reject(err);
        UserInvitation.update(
          {
            _id: invitationId
          },
          {
            $set: {
              joinedNetwork: res,
              joinedLocation: locationCode,
              invitationStatus: UserInvitation.StatusMapping.Accepted,
              inviteStatusUpdatedAt: new Date()
            }
          }
        );

        agenda.schedule(new Date(Date.now() + 30000), "whitelist nodes", {
          newNode_id: res,
          node_id: network._id
        });

        resolve(invitationId);
      }
    );
  });
};

NetworkInvitation.rejectInvitation = async function(invitationId) {
  return UserInvitation.update(
    {
      _id: invitationId
    },
    {
      $set: {
        invitationStatus: UserInvitation.StatusMapping.Rejected,
        inviteStatusUpdatedAt: new Date()
      }
    }
  );
};

NetworkInvitation.cancelInvitation = async function(inviteId, userId) {
  return UserInvitation.update(
    {
      _id: inviteId,
      inviteFrom: userId
    },
    {
      $set: {
        inviteStatusUpdatedAt: new Date(),
        invitationStatus: UserInvitation.StatusMapping.Cancelled
      }
    }
  );
};

NetworkInvitation.resendInvitation = async function(inviteId, userId) {
  const invite = UserInvitation.find({
    _id: inviteId,
    inviteFrom: userId
  }).fetch()[0];
  if (!invite) {
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

  const Template = await getEJSTemplate({
    fileName: "invite-user.ejs"
  });
  const emailHtml = Template({
    network,
    invitingUser,
    networkJoinLink: joinNetworkLink
  });

  await sendEmail({
    from: {
      name: "Blockcluster",
      email: "no-reply@blockcluster.io"
    },
    to: invite.metadata.inviteTo.email,
    subject: `Invite to join ${network.name} network on blockcluster.io`,
    text: `Visit the following link to join ${
      network.name
    } network on blockcluster.io - ${joinNetworkLink}`,
    html: emailHtml
  });

  UserInvitation.update(
    {
      _id: inviteId
    },
    {
      $set: {
        invitationStatus: UserInvitation.StatusMapping.Pending
      },
      $inc: {
        resendCount: 1
      }
    }
  );

  return true;
};

Meteor.methods({
  verifyInvitationLink: NetworkInvitation.verifyInvitationLink,
  acceptInvitation: NetworkInvitation.acceptInvitation,
  rejectInvitation: NetworkInvitation.rejectInvitation,
  updatePasswordAndInfo: (id, password, profile) => {
    Meteor.users.update(
      {
        _id: id
      },
      {
        $set: {
          profile
        }
      }
    );
    const user = Meteor.users
      .find({
        _id: id
      })
      .fetch()[0];
    const updateResult = Meteor.users.update(
      {
        _id: id,
        "emails.address": user.emails[0].address
      },
      {
        $set: {
          "emails.$.verified": true
        }
      }
    );
    return Accounts.setPassword(id, password);
  },
  cancelInvitation: NetworkInvitation.cancelInvitation,
  resendInvitation: NetworkInvitation.resendInvitation
});

export default NetworkInvitation;
