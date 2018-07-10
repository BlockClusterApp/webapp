import Email from "../";
// import nodemailer from "nodemailer";

import sg from "@sendgrid/mail";

// const sendEmail = function(emailOptions) {
//   return new Promise((resolve, reject) => {
//     let transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     });
//     transporter.sendMail(emailOptions, (err, info) => {
//       if (err) {
//         return reject(err);
//       }
//       return resolve(info);
//     });
//   });
// };

const sendEmail = function(emailOptions) {
  return new Promise( (resolve, reject) => {
    process.nextTick(async () => {
      sg.setApiKey(process.env.SENDGRID_API_KEY);
      const res = await sg.send(emailOptions);
      resolve();
    });
  });
};

export { sendEmail };
