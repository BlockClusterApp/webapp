import SupportTicket from '../../collections/support-ticket';
import { sendEmail } from '../emails/email-sender';
import Slack from '../communication/slack';
import { getEJSTemplate } from '../../modules/helpers/server';
import multer from 'multer';
const Parser = require('bc-sendgrid/packages/inbound-mail-parser');
const upload = multer();

const Support = {};

const MIN_ADMIN_LEVEL = 1;

const getSupportFromEmail = caseId => {
  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'production':
      return `support+${caseId}@support.blockcluster.io`;
    case 'staging':
      return `support+${caseId}@support-staging.blockcluster.io`;
    case 'dev':
      return `support+${caseId}@support-dev.blockcluster.io`;
    default:
      return `support+${caseId}@support-local.blockcluster.io`;
  }
};

Support.createTicket = async details => {
  if (!Meteor.userId() && !details.userId) {
    throw new Error('User not logged in');
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
        createdAt: new Date(),
      },
    ],
  });

  const support = SupportTicket.find({
    _id: createResult,
  }).fetch()[0];

  const user = Meteor.user();

  // Send Email to client
  const ejsTemplate = await getEJSTemplate({
    fileName: 'new-support-ticket.ejs',
  });
  const finalHTML = ejsTemplate({
    user: {
      email: user.emails[0].address,
      name: `${user.profile.firstName}`,
    },
    support,
  });

  const emailProps = {
    from: {
      email: getSupportFromEmail(support.caseId),
      name: 'Blockcluster',
    },
    to: user.emails[0].address,
    subject: `[BlockCluster] Support case #${support.caseId}`,
    text: `Your support ticket #${support.caseId} has been received. Our team will get back to you within 48hrs`,
    html: finalHTML,
  };

  await sendEmail(emailProps);

  // Send slack notification
  Slack.sendNotification({
    type: 'new-support',
    message: `*New* | Support case #${support.caseId} | ${user.emails[0].address} \n\n *${support.subject}*\n\n${support.history[0].description}`,
  });

  return support.caseId;
};

Support.addCustomerReply = async ({ id, description }) => {
  const supportTicket = SupportTicket.find({
    _id: id,
    createdBy: Meteor.userId(),
  }).fetch()[0];

  if (!supportTicket) {
    throw new Meteor.Error('Invaid support ticket id for the user');
  }

  const history = {
    description,
  };
  const updateResult = SupportTicket.update(
    {
      _id: supportTicket._id,
    },
    {
      $set: {
        status: SupportTicket.StatusMapping.BlockclusterActionPending,
      },
      $push: {
        history,
      },
    }
  );

  // Send slack notification
  Slack.sendNotification({
    type: 'support-customer-update',
    message: `*Updated* | Support case #${supportTicket.caseId} | ${Meteor.user().emails[0].address} \n\n *${supportTicket.subject}*\n\n${description}`,
  });

  return true;
};

Support.addBlockclusterReply = async ({ id, description }) => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  const support = SupportTicket.find({
    _id: id,
  }).fetch()[0];
  if (!support) {
    throw new Meteor.Error('Invaid support ticket id for the user');
  }

  const history = {
    description,
    isFromBlockcluster: true,
    status: SupportTicket.StatusMapping.CustomerActionPending,
  };
  const updateResult = SupportTicket.update(
    {
      _id: support._id,
    },
    {
      $set: {
        status: SupportTicket.StatusMapping.CustomerActionPending,
      },
      $push: {
        history,
      },
    }
  );

  const createdBy = Meteor.user();
  const user = Meteor.users
    .find({
      _id: support.createdBy,
    })
    .fetch()[0];

  const ejsTemplate = await getEJSTemplate({
    fileName: 'updated-support-ticket.ejs',
  });
  const finalHTML = ejsTemplate({
    user: {
      email: user.emails[0].address,
      name: `${user.profile.firstName}`,
    },
    support,
    description,
    updatedBy: {
      name: `${createdBy.profile.firstName} ${createdBy.profile.lastName}`,
      email: createdBy.emails[0].address,
    },
  });

  const emailProps = {
    from: {
      email: getSupportFromEmail(support.caseId),
      name: 'Blockcluster',
    },
    to: user.emails[0].address,
    subject: `[BlockCluster] Support case #${support.caseId}`,
    text: `Your support ticket #${support.caseId} has been updated.`,
    html: finalHTML,
  };

  await sendEmail(emailProps);

  return true;
};
Support.closeTicketByCustomer = id => {
  const support = SupportTicket.find({
    _id: id,
    createdBy: Meteor.userId(),
  }).fetch()[0];
  if (!support) {
    throw new Meteor.Error('Invaid support ticket id for the user');
  }

  const user = Meteor.user();

  SupportTicket.update(
    {
      _id: id,
    },
    {
      $set: {
        status: SupportTicket.StatusMapping.Resolved,
      },
      $push: {
        history: {
          description: `Closed by ${user.emails[0].address}`,
          status: SupportTicket.StatusMapping.Resolved,
        },
      },
    }
  );

  // Send slack notification
  Slack.sendNotification({
    type: 'ticket-closed',
    message: `*Closed* | Support case #${support.caseId} | ${user.emails[0].address}`,
  });

  return true;
};

Support.reopenTicketByCustomer = id => {
  const support = SupportTicket.find({
    _id: id,
    createdBy: Meteor.userId(),
  }).fetch()[0];
  if (!support) {
    throw new Meteor.Error('Invaid support ticket id for the user');
  }

  const user = Meteor.user();

  SupportTicket.update(
    {
      _id: id,
    },
    {
      $set: {
        status: SupportTicket.StatusMapping.BlockclusterActionPending,
      },
      $push: {
        history: {
          description: `Reopened by ${user.emails[0].address}`,
          status: SupportTicket.StatusMapping.BlockclusterActionPending,
        },
      },
    }
  );

  // Send slack notification
  Slack.sendNotification({
    type: 'ticket-reopened',
    message: `*ReOpened* | Support case #${support.caseId} | ${user.emails[0].address}`,
  });

  return true;
};

Support.closeTicketByAdmin = async id => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  const support = SupportTicket.find({
    _id: id,
  }).fetch()[0];
  if (!support) {
    throw new Meteor.Error('Invaid support ticket id for the user');
  }

  const admin = Meteor.user();
  const user = Meteor.users
    .find({
      _id: support.createdBy,
    })
    .fetch()[0];

  const description = `Closed by Blockcluster Support`;

  SupportTicket.update(
    {
      _id: id,
    },
    {
      $set: {
        status: SupportTicket.StatusMapping.Resolved,
      },
      $push: {
        history: {
          description,
          status: SupportTicket.StatusMapping.Resolved,
          isFromBlockcluster: true,
        },
      },
    }
  );

  const ejsTemplate = await getEJSTemplate({
    fileName: 'updated-support-ticket.ejs',
  });
  const finalHTML = ejsTemplate({
    user: {
      email: user.emails[0].address,
      name: `${user.profile.firstName}`,
    },
    support,
    description,
    updatedBy: {
      name: `${admin.profile.firstName} ${admin.profile.lastName}`,
      email: admin.emails[0].address,
    },
  });

  const emailProps = {
    from: {
      email: getSupportFromEmail(support.caseId),
      name: 'Blockcluster',
    },
    to: user.emails[0].address,
    subject: `[BlockCluster] Support case #${support.caseId}`,
    text: `Your support ticket #${support.caseId} has been closed.`,
    html: finalHTML,
  };

  await sendEmail(emailProps);

  return true;
};

Support.reopenTicketByAdmin = async id => {
  if (Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  const support = SupportTicket.find({
    _id: id,
  }).fetch()[0];
  if (!support) {
    throw new Meteor.Error('Invaid support ticket id for the user');
  }

  const admin = Meteor.user();
  const user = Meteor.users
    .find({
      _id: support.createdBy,
    })
    .fetch()[0];

  const description = `Reopened by Blockcluster Support`;

  SupportTicket.update(
    {
      _id: id,
    },
    {
      $set: {
        status: SupportTicket.StatusMapping.CustomerActionPending,
      },
      $push: {
        history: {
          description,
          status: SupportTicket.StatusMapping.CustomerActionPending,
          isFromBlockcluster: true,
        },
      },
    }
  );

  const ejsTemplate = await getEJSTemplate({
    fileName: 'updated-support-ticket.ejs',
  });
  const finalHTML = ejsTemplate({
    user: {
      email: user.emails[0].address,
      name: `${user.profile.firstName}`,
    },
    support,
    description,
    updatedBy: {
      name: `${admin.profile.firstName} ${admin.profile.lastName}`,
      email: admin.emails[0].address,
    },
  });

  const emailProps = {
    from: {
      email: getSupportFromEmail(support.caseId),
      name: 'Blockcluster',
    },
    to: user.emails[0].address,
    subject: `[BlockCluster] Support case #${support.caseId}`,
    text: `Your support ticket #${support.caseId} has been reopened.`,
    html: finalHTML,
  };

  await sendEmail(emailProps);

  return true;
};

JsonRoutes.Middleware.use('/api/emails/incoming', upload.fields([]));

JsonRoutes.add('post', '/api/emails/incoming', (req, res) => {
  const parser = new Parser(
    {
      keys: ['to', 'from', 'subject', 'html', 'attachments', 'email', 'rawEmail'],
    },
    req
  );

  const email = parser.keyValues();
  let contentEndIndex = email.html.indexOf(`<div class="gmail_extra">`);
  if (contentEndIndex < 0) {
    contentEndIndex = email.html.indexOf(`<div class="gmail_quote">`);
  }
  if (contentEndIndex < 0) {
    contentEndIndex = email.html.length;
  }
  const content = email.html.substring(0, contentEndIndex);
  const caseId = email.to
    .substring(email.to.indexOf('<'), email.to.indexOf('>'))
    .split('+')[1]
    .split('@')[0];
  const userEmail = email.from.substring(email.from.indexOf('<') + 1, email.from.indexOf('>'));

  const user = Meteor.users
    .find({
      'emails.address': userEmail,
    })
    .fetch()[0];

  if (!user) {
    RavenLogger.log('JSONRoute:/api/emails/incoming: Cannot find related user', email);
    throw new Error('Cannot find user who sent this email');
  }

  const history = {
    description: content,
    via: 'email',
    updatedBy: user._id,
  };
  const updateResult = SupportTicket.update(
    {
      caseId,
      createdBy: user._id,
      status: {
        $nin: [SupportTicket.StatusMapping.Resolved, SupportTicket.StatusMapping.Cancelled, SupportTicket.StatusMapping.SystemClosed],
      },
    },
    {
      $set: {
        status: SupportTicket.StatusMapping.BlockclusterActionPending,
      },
      $push: {
        history,
      },
    }
  );
  res.end('OK');

  return true;
});

Meteor.methods({
  createSupportTicket: Support.createTicket,
  addSupportTicketReplyByCustomer: Support.addCustomerReply,
  addSupportBlockclusterReply: Support.addBlockclusterReply,
  closeTicketFromCustomer: Support.closeTicketByCustomer,
  closeTicketByAdmin: Support.closeTicketByAdmin,
  reopenTicketFromCustomer: Support.reopenTicketByCustomer,
  reopenTicketByAdmin: Support.reopenTicketByAdmin,
});

export default Support;
