import ModelHelpers from './model-helpers';
import crypto from "crypto";
import ejs from "ejs";

const fs = Npm.require("fs");
const path = Npm.require("path");

function generateRandomString(email, salt = "I<3BlockCluster") {
  return crypto
    .createHash("sha256")
    .update(`${email}${salt}${new Date().getTime()}`, "utf8")
    .digest("hex");
}

function generateCompleteURLForEmailVerification(param) {
  return `${
    process.env.API_HOST ? `https://${process.env.API_HOST}` : "http://localhost:3000"
  }/app/email-verify?key=${param}`;
}

function getEJSTemplate(
  filePath = path.join(
    process.cwd().split(".meteor")[0],
    "imports",
    "modules",
    "template",
    "email-verification.ejs"
  )
) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, buffer) => {
      if (err) {
        return reject(err);
      }
      const content = buffer.toString();
      return resolve(
        ejs.compile(content, {
          cache: true,
          filename: filePath
        })
      );
    });
  });
}

export {
    generateRandomString,
    generateCompleteURLForEmailVerification,
    getEJSTemplate,
    ModelHelpers
  }
  