import SupportTicket from '../../collections/support-ticket';
import { sendEmail } from '../emails/email-sender';
import Slack from '../slack';

const Support = {};

Support.createTicket = async (details) => {
  if(!Meteor.userId() && !details.userId) {
    throw new Error("User not logged in");
  }
  const createResult = SupportTicket.insert({
    subject: details.subject,
    description: details.description,
    supportObject: details.supportObject
  });

  console.log("Support create result", createResult);

  const support = Support.find({
    _id: createResult
  });

  const user = Meteor.user();

  // Send Email to client
  const ejsTemplate = await getEJSTemplate({fileName: "new-support-ticket.ejs"});
  const finalHTML = ejsTemplate({
    user: {
      email: user.emails[0].address,
      name: `${user.profile.firstName} ${user.profile.lastName}`
    },
    support
  });

  const emailProps = {
    from: {email: `support+${support.caseId}@blockcluster.io`, name: "Blockcluster"},
    to: email,
    subject: `[BlockCluster] Support case #${support.caseId}`,
    text: `Your support ticket #${support.caseId} has been received. Our team will get back to you within 48hrs`,
    html: finalHTML
  };

  await sendEmail(emailProps);

  // Send slack notification
  Slack.sendNotification({
    type: 'new-support',
    message: `Support case #${support.caseId} | ${user.emails[0].address} \n\n *${support.subject}*\n\n${support.description}`
  })

  return true;
}

export default Support;
