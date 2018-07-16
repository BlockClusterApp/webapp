import ModelHelpers from "./model-helpers";
import crypto from "crypto";
import ejs from "ejs";
import Config from '../../config/server';

const EmailVerificationTemplate = require('../../template/email-verification');
const ForgotPasswordTemplate = require('../../template/forgot-password');

const EJSMapping = {
  'email-verification.ejs': EmailVerificationTemplate,
  'forgot-password.ejs': ForgotPasswordTemplate
};

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
  return generateURL(`/email-verify?key=${query}`);
}

function generateCompleteURLForPasswordReset(query) {
  return generateURL(`/reset-password?key=${query}`);
}

function getEJSTemplate({fileName}) {
  return new Promise(resolve => {
    if(!fileName){
      fileName = "email-verification.ejs";
    }
    const content = EJSMapping[fileName];
    resolve(ejs.compile(content, {
      cache: true,
      filename: fileName
    }));
  });
}

export {
    generateRandomString,
    generateCompleteURLForEmailVerification,
    generateCompleteURLForPasswordReset,
    getEJSTemplate,
    ModelHelpers
  }
