import ModelHelpers from "../model-helpers";
import crypto from "crypto";
import ejs from "ejs";
import Config from '../../config/server';

require('./http-interceptor');

const EmailVerificationTemplate = require('../../template/email-verification');
const ForgotPasswordTemplate = require('../../template/forgot-password');
const InviteUserTemplate = require('../../template/invite-user');
const CreditCardLink48hrs = require('../../template/credit-card-link-reminder');
const InitialSupportTicket = require('../../template/new-support-ticket');
const UpdatedSupportTicket = require('../../template/updated-support-ticket');
const InvoiceTemplate = require('../../template/invoice');
const InvoiceGeneratedTemplate = require('../../template/invoice-created');

const EJSMapping = {
  'email-verification.ejs': EmailVerificationTemplate,
  'forgot-password.ejs': ForgotPasswordTemplate,
  'invite-user.ejs': InviteUserTemplate,
  'credit-card-link-reminder.ejs': CreditCardLink48hrs,
  'new-support-ticket.ejs': InitialSupportTicket,
  'updated-support-ticket.ejs': UpdatedSupportTicket,
  'invoice.ejs': InvoiceTemplate,
  'invoice-created.ejs': InvoiceGeneratedTemplate
};

function generateRandomString(placeholder, salt = "I<3BlockCluster") {
  return `${new Date().getTime()}${crypto
    .createHash("sha256")
    .update(`${placeholder}${salt}${new Date().getTime()}`, "utf8")
    .digest("hex")}`;
}

function generateURL(route){
  return `${Config.apiHost.replace(":3000/", ':3000')}${route}`;
}

function generateCompleteURLForUserInvite(query) {
  return generateURL(`/accept-invitation?invitation=${query}`)
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
