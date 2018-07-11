import EmailVerification from "./promisified-functions";
import Email from "../../emails";
import {
  generateRandomString,
  generateCompleteURL,
  getEJSTemplate
} from "./helpers";

const Verifier = {};

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
  const reply = await EmailVerification.insert({
    accountId: user._id,
    emailId: email,
    uniqueToken: uniqueString
  });

  return true;
};

Verifier.validateToken = function(token, emailId) {
  console.log("Validating token", token, emailId);
  return new Promise(async (resolve, reject) => {
    let emailVerificationDoc;
    try {
      emailVerificationDoc = await EmailVerification.findOne({
        uniqueToken: token,
        emailId,
        active: true
      });
    } catch (err) {
      console.log(err);
      return resolve(false);
    }

    console.log(emailVerificationDoc);

    const accountId = emailVerificationDoc.accountId;
    Accounts.updateOne(
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
      },
      async (err, res) => {
        try {
          await EmailVerification.updateOne(
            {
              _id: emailVerificationDoc._id
            },
            {
              $set: {
                active: false
              }
            }
          );
        } catch (_err) {
          return reject(_err);
        }
        if (err) return reject(err);
        return resolve(res);
      }
    );
  });
};

export default Verifier;
