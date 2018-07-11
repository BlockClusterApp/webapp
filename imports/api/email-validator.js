import EmailValidator from '../collections/email-verification/server/main';


// JsonRoutes.add("GET", "/api/email-verify", (req, res, next) => {
//     const token = req.query.key;
//     console.log("Verifying token", token);
// });

Meteor.methods({
    async emailVerification (token, email){
        const result = await EmailValidator.validateToken(token, email);
        return result;
    }
})