import Email from "../";
import nodemailer from "nodemailer";

const sendEmail = function(emailOptions) {
  return new Promise((resolve, reject) => {
    let transporter = nodemailer.createTransport(
      `smtps://${user}:${password}@smtp.gmail.com`
    );
    transporter.sendMail(emailOptions, (err, info) => {
      if (err) {
        return reject(err);
      }
      return resolve(info);
    });
  });
};

export { sendEmail };
