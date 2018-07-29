import { Email } from "../../collections/emails";
import Config from '../../modules/config/server';
// import nodemailer from "nodemailer";

import sg from "@sendgrid/mail";

/*
emailOptions
{
  from: {email: "jason@blockcluster.io", name: "Jason from Blockcluster"},
  to: email,
  subject: `Confirm ${user.emails[0].address} on blockcluster.io`,
  text: `Visit the following link to verify your email address. ${link}`,
  html: finalHTML
}
*/

const toEmail = process.env.EMAIL || "jibin.mathews@blockcluster.io";

const sendEmail = function(emailOptions) {
  return new Promise( (resolve, reject) => {
    process.nextTick(async () => {
      if(!['production','staging'].includes(process.env.NODE_ENV)){
        emailOptions.subject = `${emailOptions.subject} | To: ${emailOptions.to}`
        emailOptions.to = toEmail;
      }
      sg.setApiKey(Config.sendgridAPIKey);
      const res = await sg.send(emailOptions);
      const insertResult = Email.insert(emailOptions);
      resolve();
    });
  });
};

export { sendEmail };
