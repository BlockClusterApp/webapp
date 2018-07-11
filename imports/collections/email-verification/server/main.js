import {EmailVerification} from '../';
import Email from "../../emails";
import {
  generateRandomString,
  generateCompleteURL,
  getEJSTemplate
} from "./helpers";

const Verifier = {};

function insertToEmailVerification(doc) {
  return new Promise((resolve, reject) => {
    EmailVerification.insert(doc, (err, res) => {
      if(err) return reject(err);
      return resolve(res);
    });
  })
}

Verifier.sendEmailVerification = async function(user) {
  const email = user.emails[0].address;
  const uniqueString = generateRandomString(email);
  const link = generateCompleteURL(uniqueString);

  const ejsTemplate = await getEJSTemplate();
  const finalHTML = ejsTemplate({
    user: {
      email,
      name: `${user.profile.firstName} ${user.profile.lastName}`
    },
    verificationLink: link
  });

  const emailProps = {
    from: "no-reply@blockcluster.io",
    to: email,
    subject: `Confirm ${user.emails[0].address} on blockcluster.io`,
    text: `Visit the following link to verify your email address. ${link}`,
    html: finalHTML
  };

  await Email.sendEmail(emailProps);

  // TODO: Wrapper around callback insert for async await to work
  const reply = await insertToEmailVerification({
    accountId: user._id,
    emailId: email,
    uniqueToken: uniqueString,
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
      email: emailVerificationDoc.emailId,
      verified: false
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
