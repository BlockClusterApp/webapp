import { Email } from "../../collections/emails";
import Bull from '../../modules/schedulers/bull';

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
      if(!['production'].includes(process.env.NODE_ENV)){
        if(!emailOptions.to.includes('@blockcluster.io')){
          emailOptions.subject = `${emailOptions.subject} | To: ${emailOptions.to}`
          emailOptions.to = toEmail;
        }
      }
      Bull.addJob('send-email', {
        email: emailOptions
      })
      resolve();
    });
  });
};

export { sendEmail };
