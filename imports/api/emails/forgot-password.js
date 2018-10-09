import { PasswordResetRequest } from "../../collections/password-reset";
import Email from "./email-sender";
import {
  generateRandomString,
  generateCompleteURLForPasswordReset,
  getEJSTemplate
} from "../../modules/helpers/server";

const PasswordResetter = {};

PasswordResetter.resetLinkEmail = async function(email) {
  const user = Meteor.users.find({
    "emails.address": email
  }).fetch()[0];

  if(!user){
    return true;
  }

  const uniqueString = generateRandomString(`${email}-${new Date().toString()}`);
  const link = generateCompleteURLForPasswordReset(uniqueString);

  const ejsTemplate = await getEJSTemplate({fileName: "forgot-password.ejs"});
  const finalHTML = ejsTemplate({
    user: {
      email,
      name: `${user.profile.firstName} ${user.profile.lastName}`
    },
    resetPasswordLink: link
  });

  const emailProps = {
    from: {email: "support@blockcluster.io", name: "Support from Blockcluster"},
    to: email,
    subject: `Reset your password at Blockcluster.io`,
    text: `Visit the following link to reset your password. ${link}`,
    html: finalHTML
  };

  await Email.sendEmail(emailProps);

  const reply = PasswordResetRequest.insert({
    accountId: user._id,
    emailId: email,
    uniqueToken: uniqueString
  });

  return true;
};

PasswordResetter.validateToken = function(token) {
  return new Promise(async (resolve, reject) => {
    let passwordResetRequest;
    try {
      passwordResetRequest = PasswordResetRequest.find({
        uniqueToken: token,
        active: true
      }).fetch()[0];
    } catch (err) {
      console.log(err);
      return resolve(false);
    }

    if(!passwordResetRequest) {
      return resolve(false)
    }

    return resolve(true);
  });
};

PasswordResetter.changePassword = async function(token, password) {
  const passwordResetRequest = PasswordResetRequest.find({
    uniqueToken: token,
    active: true
  }).fetch()[0];
  if(!passwordResetRequest){
    return false;
  }
  Accounts.setPassword(passwordResetRequest.accountId, `${password}`);
  PasswordResetRequest.update({
    _id: passwordResetRequest._id
  }, {
    $set: {
      active: false
    }
  });
  return true;
}



Meteor.methods({
  async requestPasswordReset(email) {
    return PasswordResetter.resetLinkEmail(email);
  },
  async verifyResetPasswordLink(token) {
    return PasswordResetter.validateToken(token);
  },
  async changeUserPassword(token, password) {
    return PasswordResetter.changePassword(token, password);
  }
})
