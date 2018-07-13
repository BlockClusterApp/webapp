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

function generateURL(route){
  return `${
    process.env.API_HOST ? `https://${process.env.API_HOST}` : "http://localhost:3000"
  }${route}`;
}

function generateCompleteURLForEmailVerification(query) {
  return generateURL(`/app/email-verify?key=${query}`);
}

function generateCompleteURLForPasswordReset(query) {
  return generateURL(`/app/reset-password?key=${query}`);
}

function getEJSTemplate({filePath, fileName}) {
  const _filePath = filePath || path.join(
    process.cwd().split(".meteor")[0],
    "imports",
    "modules",
    "template",
    fileName
    )
  return new Promise((resolve, reject) => {
    fs.readFile(_filePath, (err, buffer) => {
      if (err) {
        return reject(err);
      }
      const content = buffer.toString();
      return resolve(
        ejs.compile(content, {
          cache: true,
          filename: _filePath
        })
      );
    });
  });
}

export {
    generateRandomString,
    generateCompleteURLForEmailVerification,
    generateCompleteURLForPasswordReset,
    getEJSTemplate,
    ModelHelpers
  }
  