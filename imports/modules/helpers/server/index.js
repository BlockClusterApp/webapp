import ModelHelpers from "./model-helpers";
import crypto from "crypto";
import ejs from "ejs";
import Config from '../../config/server';

require('./http-interceptor');

const EmailVerificationTemplate = require('../../template/email-verification');
const ForgotPasswordTemplate = require('../../template/forgot-password');
const InviteUserTemplate = require('../../template/invite-user');

const EJSMapping = {
  'email-verification.ejs': EmailVerificationTemplate,
  'forgot-password.ejs': ForgotPasswordTemplate,
  'invite-user.ejs': InviteUserTemplate
};

const fs = Npm.require("fs");
const path = Npm.require("path");

function generateRandomString(placeholder, salt = "I<3BlockCluster") {
  return crypto
    .createHash("sha256")
    .update(`${placeholder}${salt}${new Date().getTime()}`, "utf8")
    .digest("hex");
}

function generateURL(route){
  return `${Config.apiHost.replace(":3000/", ':3000')}${route}`;
}

function generateCompleteURLForUserInvite(query) {
  return generateURL(`/invite-user?invitation=${query}`)
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
    generateCompleteURLForUserInvite,
    getEJSTemplate,
    ModelHelpers
  }
