import crypto from "crypto";
import path from "path";
import fs from "fs";
import ejs from "ejs";

function generateRandomString(email, salt = "I<3BlockCluster") {
  return crypto
    .createHash("sha256")
    .update(`${email}${salt}${new Date().getTime()}`, "utf8")
    .digest();
}

function generateCompleteURL(param) {
  return `${process.env.API_HOST ||
    "localhost:3000"}/email-verify?key=${param}`;
}

function getEJSTemplate(
  filePath = path.join(__dirname, "..", "template", "email-verification.ejs")
) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, buffer) => {
      if (err) {
        return reject(err);
      }
      const content = buffer.toString();
      return resolve(ejs.compile(content, {
        cache: true,
        filename: filePath
      }));
    });
  });
}

module.exports = {
  generateRandomString,
  generateCompleteURL,
  getEJSTemplate
};
