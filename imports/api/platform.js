import RedisJwt from 'redis-jwt';
import Config from '../modules/config/server';
import Fiber from 'fibers';
import NetworkConfig from '../api/network/network-configuration';

var BigNumber = require('bignumber.js');

const jwt = new RedisJwt({
  host: Config.redisHost,
  port: Config.redisPort,
  secret: 'rch4nuct90i3t9ik#%$^&u3jrmv29r239cr2',
  multiple: true,
});

JsonRoutes.add('get', '/ping', function(req, res, next) {
  JsonRoutes.sendResult(res, {
    code: 200,
    data: 'ping',
  });
});

JsonRoutes.add('post', '/api/platform/login', function(req, res, next) {
  function authenticationFailed() {
    JsonRoutes.sendResult(res, {
      code: 401,
      data: { error: 'Wrong username or password' },
    });
  }

  let password = req.body.password;
  let user = Accounts.findUserByEmail(req.body.email);

  let result = Accounts._checkPassword(user, password);

  if (result.error) {
    authenticationFailed();
  } else {
    jwt
      .sign(req.body.email, {
        ttl: '1 year',
      })
      .then(token => {
        JsonRoutes.sendResult(res, {
          data: {
            access_token: token,
          },
        });
        // res.end(JSON.stringify({
        //     access_token: token
        // }))
      })
      .catch(err => {
        authenticationFailed();
      });
  }
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth.split(" ")[1];


}

function authMiddleware(req, res, next) {
  function getToken(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      // Authorization: Bearer g1jipjgi1ifjioj
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

  var token = getToken(req);

  jwt
    .verify(token)
    .then(decode => {
      if (decode == false) {
        JsonRoutes.sendResult(res, {
          code: 401,
          data: { error: 'Invalid JWT token' },
        });
      } else {
        req.email = decode.id;
        req.rjwt = decode.rjwt;
        next();
      }
    })
    .catch(err => {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: { error: 'Invalid JWT token' },
      });
    });
}

JsonRoutes.Middleware.use('/api/platform/networks', authMiddleware);
JsonRoutes.Middleware.use('/api/platform/logout', authMiddleware);

JsonRoutes.add('post', '/api/platform/networks/create', function(req, res, next) {
  let { name, locationCode } = req.body;

  if (!locationCode) {
    locationCode = 'us-west-2';
  }

  let user = Accounts.findUserByEmail(req.email);

  Meteor.call('createNetwork', { networkName: name, locationCode, userId: user._id }, (error, instanceId) => {
    if (error) {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: { error: 'An unknown error occurred' },
      });
    } else {
      res.end(
        JSON.stringify({
          instanceId: instanceId,
        })
      );
    }
  });
});


JsonRoutes.add('get', '/api/platform/networks/types', function(req, res) {
  Fiber(async function () {
    const configs = await NetworkConfig.getConfigs();
  }).run();
});



JsonRoutes.add('post', '/api/platform/networks/invite', function(req, res, next) {
  let user = Accounts.findUserByEmail(req.email);
  let inviteUserEmail = req.body.inviteEmail;
  let networkId = req.body.networkId;
  let memberType = req.body.memberType;

  Meteor.call('inviteUserToNetwork', networkId, memberType, inviteUserEmail, user._id, (error, instanceId) => {
    if (error) {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: { error: 'An unknown error occured' },
      });
    } else {
      res.end(
        JSON.stringify({
          message: 'Successfully Invited',
        })
      );
    }
  });
});

JsonRoutes.add('post', '/api/platform/networks/delete', function(req, res, next) {
  let user = Accounts.findUserByEmail(req.email);
  let networkId = req.body.networkId;

  Meteor.call('deleteNetwork', networkId, (error, instanceId) => {
    if (error) {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: { error: 'An unknown error occured' },
      });
    } else {
      res.end(
        JSON.stringify({
          message: 'Successfully Deleted',
        })
      );
    }
  });
});

JsonRoutes.add('post', '/api/platform/logout', function(req, res, next) {
  const call = jwt.call();
  call
    .destroy(req.rjwt)
    .then(() => {
      res.end(
        JSON.stringify({
          message: 'Logout successful',
        })
      );
    })
    .catch(() => {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: { error: 'An unknown error occured' },
      });
    });
});
