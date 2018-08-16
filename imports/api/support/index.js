import SupportTicket from "../../collections/support-ticket";
import { sendEmail } from "../emails/email-sender";
import Slack from "../slack";
import { getEJSTemplate } from "../../modules/helpers/server";

const Support = {};

Support.createTicket = async details => {
  if (!Meteor.userId() && !details.userId) {
    throw new Error("User not logged in");
  }
  const createResult = SupportTicket.insert({
    subject: details.subject,
    supportObject: details.supportObject,
    ticketType: details.ticketType,
    history: [
      {
        description: details.description.replace(/\r?\n/g, '<br />'),
        status: SupportTicket.StatusMapping.Filed,
        updatedBy: Meteor.userId(),
        createdAt: new Date()
      }
    ]
  });

  console.log("Support create result", createResult);

  const support = SupportTicket.find({
    _id: createResult
  }).fetch()[0];

  const user = Meteor.user();

  // Send Email to client
  const ejsTemplate = await getEJSTemplate({
    fileName: "new-support-ticket.ejs"
  });
  const finalHTML = ejsTemplate({
    user: {
      email: user.emails[0].address,
      name: `${user.profile.firstName}`
    },
    support
  });

  const emailProps = {
    from: {
      email: `support+${support.caseId}@blockcluster.io`,
      name: "Blockcluster"
    },
    to: user.emails[0].address,
    subject: `[BlockCluster] Support case #${support.caseId}`,
    text: `Your support ticket #${
      support.caseId
    } has been received. Our team will get back to you within 48hrs`,
    html: finalHTML
  };

  await sendEmail(emailProps);

  // Send slack notification
  Slack.sendNotification({
    type: "new-support",
    message: `Support case #${support.caseId} | ${
      user.emails[0].address
    } \n\n *${support.subject}*\n\n${support.history[0].description}`
  });

  return support.caseId;
};

Support.addCustomerReply = async ({id, description}) => {
  const supportTicket = SupportTicket.find({
    _id: id,
    createdBy: Meteor.userId()
  }).fetch()[0];

  if(!supportTicket) {
    throw new Meteor.Error("Invaid support ticket id for the user");
  }

  const history = {
    description
  };
  const updateResult = SupportTicket.update({
    _id: supportTicket._id
  }, {
    $set: {
      status: SupportTicket.StatusMapping.BlockclusterActionPending
    },
    $push: {
      history
    }
  });

  return true;
}

Support.addBlockclusterReply = async ({id, description}) => {
  const support = SupportTicket.find({
    _id: id
  }).fetch()[0];
  if(!support) {
    throw new Meteor.Error("Invaid support ticket id for the user");
  }

  const history = {
    description,
    isFromBlockcluster: true
  };
  const updateResult = SupportTicket.update({
    _id: support._id
  }, {
    $set: {
      status: SupportTicket.StatusMapping.BlockclusterActionPending
    },
    $push: {
      history
    }
  });

  const createdBy = Meteor.user();
  const user = Meteor.users.find({
    _id: support.createdBy
  }).fetch()[0];

  const ejsTemplate = await getEJSTemplate({
    fileName: "updated-support-ticket.ejs"
  });
  const finalHTML = ejsTemplate({
    user: {
      email: user.emails[0].address,
      name: `${user.profile.firstName}`
    },
    support,
    description,
    updatedBy: {
      name: `${createdBy.profile.firstName} ${createdBy.profile.lastName}`,
      email: createdBy.emails[0].address
    }
  });

  const emailProps = {
    from: {
      email: `support+${support.caseId}@blockcluster.io`,
      name: "Blockcluster"
    },
    to: user.emails[0].address,
    subject: `[BlockCluster] Support case #${support.caseId}`,
    text: `Your support ticket #${
      support.caseId
    } has been updated.`,
    html: finalHTML
  };

  await sendEmail(emailProps);

  return true;

}

Meteor.methods({
  createSupportTicket: Support.createTicket,
  addSupportTicketReplyByCustomer: Support.addCustomerReply,
  addSupportBlockclusterReply: Support.addBlockclusterReply
});

export default Support;
