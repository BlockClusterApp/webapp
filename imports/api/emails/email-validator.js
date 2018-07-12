import { EmailVerification } from "../../collections/email-verification";
import Email from "./email-sender";
import {
  generateRandomString,
  generateCompleteURLForEmailVerification,
  getEJSTemplate
} from "../../modules/helpers/server";

const Verifier = {};

Verifier.sendEmailVerification = async function(user) {
  const email = user.emails[0].address;
  const uniqueString = generateRandomString(email);
  const link = generateCompleteURLForEmailVerification(uniqueString);

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
  const reply = EmailVerification.insert({
    accountId: user._id,
    emailId: email,
    uniqueToken: uniqueString
  });

  return true;
};

Verifier.validateToken = function(token, emailId) {
  return new Promise(async (resolve, reject) => {
    let emailVerificationDoc;
    try {
      emailVerificationDoc = EmailVerification.find({
        uniqueToken: token,
        emailId,
        active: true
      }).fetch()[0];
    } catch (err) {
      console.log(err);
      return resolve(false);
    }

    if(!emailVerificationDoc) {
      return resolve(false)
    }

    const accountId = emailVerificationDoc.accountId;
    const updateResult = Meteor.users.update(
      {
        _id: accountId,
        "emails.address": emailVerificationDoc.emailId,
      },
      {
        $set: {
          "emails.$.emailVerified": true
        }
      }
    );
        
    const emailUpdateResult = EmailVerification.update(
            {
              _id: emailVerificationDoc._id
            },
            {
              $set: {
                active: false
              }
            }
          ); 

      return resolve(true);
  });
};



Meteor.methods({
    async emailVerification (token, email){
        const result = await Verifier.validateToken(token, email);
        return result;
    }
})

export default Verifier;