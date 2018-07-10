import Email from "../";
import nodemailer from "nodemailer";

const sendEmail = function(emailOptions) {
  return new Promise((resolve, reject) => {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    transporter.sendMail(emailOptions, (err, info) => {
      if (err) {
        return reject(err);
      }
      return resolve(info);
    });
  });
};

export { sendEmail };
