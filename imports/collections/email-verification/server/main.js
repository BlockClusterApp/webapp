import EmailVerification from "../";
import Email from "../../emails";
import {
  generateRandomString,
  generateCompleteURL,
  getEJSTemplate
} from "./helpers";

const Verifier = {};

Verifier.sendEmailVerification = async function(user) {
  const uniqueString = generateRandomString(user.emails[0].email);
  const link = generateCompleteURL(uniqueString);

  const ejsTemplate = getEJSTemplate();
  const finalHTML = ejsTemplate({
    user: {
      email: user.emails[0].email,
      name: `${user.profile.first} ${user.profile.last}`
    },
    verificationLink: link
  });

  const emailProps = {
    from: "no-reply@blockcluster.io",
    to: user.emails[0].email,
    subject: `Confirm ${user.emails[0].email} on blockcluster.io`,
    text: `Visit the following link to verify your email address. ${verificationLink}`,
    html: finalHTML
  };

  const info = await Email.sendEmail(emailProps);

  // TODO: Wrapper around callback insert for async await to work
  await EmailVerification.insert({
    accountId: user._id,
    emailId: user.emails[0].email,
    uniqueToken: uniqueString,
    messageId: info.messageId
  });

  return true;
};

Verifier.validateToken = async function(token) {
  const emailVerificationDoc = await EmailVerification.findOne({
    uniqueToken: token,
    active: true
  });

  if (!emailVerificationDoc) {
    throw new Error("Invalid token");
  }

  const accountId = emailVerificationDoc.accountId;
  const account = await Accounts.updateOne(
    {
      _id: accountId,
      email: emailVerificationDoc.emailId
    },
    {
      $set: {
        "emails.$.verified": true
      }
    },
    {
      upsert: false
    }
  );

  return true;
};

export default Verifier;
