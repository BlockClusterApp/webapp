import EmailValidator from '../collections/email-verification/server/main';

JsonRoutes.add("GET", "/email-verify", (req, res, next) => {
    const token = req.query.key;
});