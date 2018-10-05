import {
  Hyperion
} from "../collections/hyperion/hyperion.js"
import {
  Files
} from "../collections/files/files.js"
import RedisJwt from "redis-jwt";
import helpers from "../modules/helpers"
import Config from '../modules/config/server';
const ipfsAPI = require('ipfs-api');
const fs = require('fs');
var ipfsClusterAPI = require('ipfs-cluster-api')
var multer=require("multer")
var upload=multer() //in case of scalibility issue use multer file storage. By default it uses memory.

const jwt = new RedisJwt({
  host: Config.redisHost,
  port: Config.redisPort,
  secret: 'rch4nuct90i3t9ik#%$^&u3jrmv29r239cr2',
  multiple: true
})

JsonRoutes.add("post", "/api/hyperion/login", (req, res, next) => {
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
    jwt.sign(user._id, {
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
      req.userId = decode.id;
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
JsonRoutes.Middleware.use('/api/hyperion/upload', upload.single('file'));

JsonRoutes.add("post", "/api/hyperion/upload", Meteor.bindEnvironment((req, res, next) => {
  let ipfs_connection = Config.getHyperionConnectionDetails(req.body.location);
  const ipfs = ipfsAPI(ipfs_connection[0], ipfs_connection[1], {protocol: 'http'})
  var ipfsCluster = ipfsClusterAPI(ipfs_connection[0], ipfs_connection[2], {protocol: 'http'})
  ipfs.files.add(req.file.buffer, Meteor.bindEnvironment((err, file) => {
    if (err) {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          "error": "An unknown error occured"
        }
      })
    } else {
      ipfsCluster.pin.add(file[0].hash, {"replication-min": 2, "replication-max": 3}, Meteor.bindEnvironment((err) => {
        if(!err) {
          Files.upsert({
            userId: req.userId,
            hash: file[0].hash
          }, {
            $set: {
              fileName: req.file.originalName,
              mimetype: req.file.mimetype,
              size: req.file.size
            }
          })

          Hyperion.upsert({
            userId: req.userId
          }, {
            $inc: {
              size: req.file.size
            }
          })

          res.end(JSON.stringify({
            "message": `${file[0].hash}`
          }))
        } else {
          JsonRoutes.sendResult(res, {
            code: 401,
            data: {
              "error": "An unknown error occured"
            }
          })
        }
      }))
    }
  }))
}))

JsonRoutes.add("get", "/api/hyperion/download", function(req, res, next) {
  let hash = req.query.hash;
  let ipfs_connection = Config.getHyperionConnectionDetails(req.query.location);
  const ipfs = ipfsAPI(ipfs_connection[0], ipfs_connection[1], {protocol: 'http'})
  var ipfsCluster = ipfsClusterAPI(ipfs_connection[0], ipfs_connection[2], {protocol: 'http'})
  ipfs.files.get(hash, (err, files) => {
    files.forEach((file) => {
      if(file) {
        res.end(file.content)
      }
    })
  })
});

//while removing check if any other person has the same file uploaded or not. If not then only delete.
JsonRoutes.add("delete", "/api/hyperion/delete", (req, res, next) => {
  let hash = req.query.hash;
  let ipfs_connection = Config.getHyperionConnectionDetails(req.query.location);
  const ipfs = ipfsAPI(ipfs_connection[0], ipfs_connection[1], {protocol: 'http'})
  var ipfsCluster = ipfsClusterAPI(ipfs_connection[0], ipfs_connection[2], {protocol: 'http'})
  ipfs.pin.rm(hash, {}, (err, x) => {
    if(!err) {
      ipfsCluster.pin.rm(hash, {}, (err, x) => {
        if(err) {
          JsonRoutes.sendResult(res, {
            code: 401,
            data: {
              "error": "An unknown error occured"
            }
          })
        } else {
          res.end(JSON.stringify({
            "message": "File removed successfully"
          }))
        }
      })
    } else {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          "error": "An unknown error occured"
        }
      })
    }
  })
});

JsonRoutes.add("post", "/api/hyperion/logout", (req, res, next) => {
  const call = jwt.call();
  call.destroy(req.rjwt).then(() => {
    res.end(JSON.stringify({
      "message": "Logout successful"
    }))
  }).catch((e) => {
    JsonRoutes.sendResult(res, {
      code: 401,
      data: {
        "error": "An unknown error occured"
      }
    })
  })
})
