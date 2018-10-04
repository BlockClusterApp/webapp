import {
  Hyperion
} from "../collections/hyperion/hyperion.js"
import RedisJwt from "redis-jwt";
import helpers from "../modules/helpers"
import Config from '../modules/config/server';
var Busboy = require('busboy');
const ipfsAPI = require('ipfs-api');
const fs = require('fs');

const jwt = new RedisJwt({
  host: Config.redisHost,
  port: Config.redisPort,
  secret: 'rch4nuct90i3t9ik#%$^&u3jrmv29r239cr2',
  multiple: true
})

JsonRoutes.add("post", "/api/hyperion/login", function(req, res, next) {
  function authenticationFailed() {
    JsonRoutes.sendResult(res, {
      code: 401,
      data: {
        "error": "Wrong username or password"
      }
    })
  }

  let password = req.body.password;
  let user = Accounts.findUserByEmail(req.body.email)
  let result = Accounts._checkPassword(user, password)

  if (result.error) {
    authenticationFailed()
  } else {
    jwt.sign(req.body.email, {
      ttl: "1 year"
    }).then(token => {
      JsonRoutes.sendResult(res, {
        data: {
          access_token: token
        }
      })
      // res.end(JSON.stringify({
      //     access_token: token
      // }))
    }).catch(err => {
      authenticationFailed()
    })
  }
})

function authMiddleware(req, res, next) {

  function getToken(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') { // Authorization: Bearer g1jipjgi1ifjioj
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

  jwt.verify(token).then(decode => {
    if (decode == false) {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          "error": "Invalid JWT token"
        }
      })
    } else {
      req.email = decode.id;
      req.rjwt = decode.rjwt;
      next();
    }
  }).catch(err => {
    JsonRoutes.sendResult(res, {
      code: 401,
      data: {
        "error": "Invalid JWT token"
      }
    })
  })
}

JsonRoutes.Middleware.use("/api/hyperion/upload", authMiddleware);
JsonRoutes.Middleware.use("/api/hyperion/logout", authMiddleware);

JsonRoutes.Middleware.use('/api/hyperion/upload', (req, res, next) => {
  const nameSuffix = helpers.instanceIDGenerate();
  const base = process.env.PWD;
  const busboy = new Busboy({ headers: req.headers });
  req.thisFile = {};
  req.body.url = 'not set';
  req.thisFile.size = 0;

  busboy.on('field', (fieldname, value) => {
    req.body[fieldname] = value;
  });

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    // console.log('busboy on file: ', filename);
    file.on('data', (data) => {
      req.thisFile.size += data.length;
    });
    req.body.mime = mimetype;
    req.file = file;
    req.thisFile.name = filename;
    req.thisFile.mime = mimetype;
    // Default value wasn't assigned?
    req.thisFile.type = 1;
    req.body.mime = mimetype;
    req.path = `${base}/temp/${nameSuffix}${filename}`;
    file.pipe(fs.createWriteStream(req.path));
  });
  // busboy.on('finish', () => { });
  req.pipe(busboy);
  next();
});

JsonRoutes.add("post", "/api/hyperion/upload", function(req, res, next) {
  const body = fs.createReadStream(req.path);

  let ipfs_connection = Config.getHyperionConnectionDetails(req.body.location);
  const ipfs = ipfsAPI(ipfs_connection[0], ipfs_connection[1], {protocol: 'http'})

  ipfs.files.add(body, (err, file) => {
    if (err) {
      console.log(err);
    } else {
      console.log(file)
    }
  })
})

JsonRoutes.add("get", "/api/hyperion/getFile", function(req, res, next) {
  let hash = req.query.hash;
  let ipfs_connection = Config.getHyperionConnectionDetails(req.query.location);
  const ipfs = ipfsAPI(ipfs_connection[0], ipfs_connection[1], {protocol: 'http'})
  ipfs.files.get(hash, function(err, files) {
    files.forEach((file) => {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: file.content.toString('utf8')
      });
    })
  })
});

JsonRoutes.add("post", "/api/hyperion/logout", function(req, res, next) {
  const call = jwt.call();
  call.destroy(req.rjwt).then(() => {
    res.end(JSON.stringify({
      "message": "Logout successful"
    }))
  }).catch((e) => {
    console.log(e)
    JsonRoutes.sendResult(res, {
      code: 401,
      data: {
        "error": "An unknown error occured"
      }
    })
  })
})
