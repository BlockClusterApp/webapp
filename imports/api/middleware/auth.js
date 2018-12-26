import Billing from '../billing';
import ApiKeys from '../../collections/api-keys';
import Config from '../../modules/config/server';

import RedisJwt from 'redis-jwt';

const jwt = new RedisJwt({
  host: Config.redisHost,
  port: Config.redisPort,
  secret: 'rch4nuct90i3t9ik#%$^&u3jrmv29r239cr2',
  multiple: true,
});

async function validateToken(token) {
  const key = ApiKeys.find({
    key: token,
  }).fetch()[0];

  if (!key) {
    return false;
  }
  return key.userId;
}

async function _authFunc(req, res, next) {
  function getToken(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      // Handle token presented as a Bearer token in the Authorization header
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      // Handle token presented as URI param
      return req.query.token;
    } else if (req.cookies && req.cookies.token) {
      // Handle token presented as a cookie parameter
      return req.cookies.token;
    }
    // If we return null, we couldn't find a token.
    // In this case, the JWT middleware will return a 401 (unauthorized) to the client for this request
    return null;
  }

  const token = getToken(req);

  if (!token) {
    return JsonRoutes.sendResult(res, {
      code: 401,
      data: {
        error: 'Unauthorized',
      },
    });
  }

  if (token.includes('.')) {
    // From platform generated API
    jwt
      .verify(token)
      .then(async decode => {
        if (decode == false) {
          return JsonRoutes.sendResult(res, {
            code: 401,
            data: {
              error: 'Invalid JWT token',
            },
          });
        } else {
          req.userId = decode.id;
          req.rjwt = decode.rjwt;
          next();
          /*
          const isPaymentMethodVerified = await Billing.isPaymentMethodVerified(decode.id);
          if (isPaymentMethodVerified) {
          } else {
            JsonRoutes.sendResult(res, {
              code: 401,
              data: {
                error: 'Verify your payment method',
              },
            });
          }
          */
        }
      })
      .catch(err => {
        return JsonRoutes.sendResult(res, {
          code: 401,
          data: {
            error: 'Invalid JWT token',
          },
        });
      });
  } else {
    // API Key
    const userId = await validateToken(token);

    if (!userId) {
      return JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          success: false,
          error: 'Unauthorized',
        },
      });
    }

    const user = Meteor.users.find({ _id: userId });

    if (user.paymentPending) {
      return JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          success: false,
          error: 'Payment Pending. Functions disabled',
        },
      });
    }

    req.userId = userId;
    req.user = user;
    next();
  }
}

_authFunc.jwt = jwt;

module.exports = _authFunc;
