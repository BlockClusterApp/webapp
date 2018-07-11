import { Email } from "../../collections/emails";
// import nodemailer from "nodemailer";

import sg from "@sendgrid/mail";

const sendEmail = function(emailOptions) {
  return new Promise( (resolve, reject) => {
    process.nextTick(async () => {
      sg.setApiKey(process.env.SENDGRID_API_KEY);
      const res = await sg.send(emailOptions);
      const insertResult = Email.insert(emailOptions);
      resolve();
    });
  });
};

export { sendEmail };
