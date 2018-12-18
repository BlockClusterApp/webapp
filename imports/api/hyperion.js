import { Hyperion } from '../collections/hyperion/hyperion.js';
import HyperionPricing from '../collections/pricing/hyperion';
import { Files } from '../collections/files/files.js';
import AuthMiddleware from './middleware/auth';
import ChargeableAPI from '../collections/chargeable-apis/';

import helpers from '../modules/helpers';
import Config from '../modules/config/server';
const ipfsAPI = require('ipfs-api');
const fs = require('fs');
var ipfsClusterAPI = require('ipfs-cluster-api');
var multer = require('multer');
var upload = multer(); //in case of scalibility issue use multer file storage. By default it uses memory.
var Future = Npm.require('fibers/future');
import Billing from './billing';

Meteor.methods({
  getHyperionToken: file => {
    var myFuture = new Future();
    AuthMiddleware.jwt
      .sign(file.userId, {
        ttl: '5 minutes',
      })
      .then(token => {
        myFuture.return(token);
      })
      .catch(err => {
        myFuture.throw();
      });

    return myFuture.wait();
  },
});

async function authMiddleware(req, res, next) {
  if (!(RemoteConfig.features && RemoteConfig.features.Hyperion)) {
    return JsonRoutes.sendResult(res, {
      code: 401,
      data: {
        error: 'Not available in this licence',
      },
    });
  }
  AuthMiddleware(req, res, next);
}

JsonRoutes.Middleware.use('/api/hyperion/upload', authMiddleware);
JsonRoutes.Middleware.use('/api/hyperion/delete', authMiddleware);
JsonRoutes.Middleware.use('/api/hyperion/logout', authMiddleware);
JsonRoutes.Middleware.use('/api/hyperion/upload', upload.single('file'));

JsonRoutes.add(
  'post',
  '/api/hyperion/upload',
  Meteor.bindEnvironment((req, res, next) => {
    let ipfs_connection = Config.getHyperionConnectionDetails(req.body.location || req.query.location);
    const ipfs = ipfsAPI(ipfs_connection[0], ipfs_connection[1], { protocol: 'http' });
    var ipfsCluster = ipfsClusterAPI(ipfs_connection[0], ipfs_connection[2], { protocol: 'http' });
    ipfs.files.add(
      req.file.buffer,
      Meteor.bindEnvironment((err, file) => {
        if (err) {
          console.log(err);
          JsonRoutes.sendResult(res, {
            code: 401,
            data: {
              error: 'An unknown error occured',
            },
          });
        } else {
          ipfsCluster.pin.add(
            file[0].hash,
            { 'replication-min': 2, 'replication-max': 3 },
            Meteor.bindEnvironment(err => {
              if (!err) {
                if (
                  Files.find({
                    userId: req.userId,
                    hash: file[0].hash,
                    region: req.body.location || req.query.location,
                  }).fetch().length == 0
                ) {
                  Files.upsert(
                    {
                      userId: req.userId,
                      hash: file[0].hash,
                    },
                    {
                      $set: {
                        uploaded: Date.now(),
                        fileName: req.file.originalname,
                        mimetype: req.file.mimetype,
                        size: req.file.size,
                        region: req.body.location || req.query.location,
                      },
                    }
                  );

                  let totalDaysThisMonth = helpers.daysInThisMonth();
                  let todayDay = new Date().getUTCDate();
                  let daysRemaining = totalDaysThisMonth - (todayDay - 1);
                  let daysIgnored = todayDay - 1;

                  const hyperionPricing = HyperionPricing.find({ active: true }).fetch()[0];
                  let costPerGBPerDay = helpers.hyperionGBCostPerDay(hyperionPricing.perGBCost);
                  let fileSizeInGB = req.file.size / 1024 / 1024 / 1024;
                  let fileCostPerDay = costPerGBPerDay * fileSizeInGB;
                  let costIgnored = daysIgnored * fileCostPerDay;

                  Hyperion.upsert(
                    {
                      userId: req.userId,
                    },
                    {
                      $inc: {
                        size: req.file.size,
                        discount: costIgnored, //deduct this amount in monthly billing and reset to 0.
                      },
                    }
                  );

                  ChargeableAPI.insert({
                    url: req.url,
                    userId: req.userId,
                    serviceType: 'hyperion',
                    metadata: {
                      type: 'UploadFile',
                      fileSizeInGB: req.file.size / 1024 / 1024 / 1024,
                      responseCode: 200,
                      response: JSON.stringify({
                        message: `${file[0].hash}`,
                        success: true,
                        method: 'POST',
                      }),
                    },
                  });

                  res.end(
                    JSON.stringify({
                      message: `${file[0].hash}`,
                      success: true,
                    })
                  );
                } else {
                  JsonRoutes.sendResult(res, {
                    code: 401,
                    data: {
                      error: 'File already exists',
                    },
                  });
                }
              } else {
                console.log(err);
                JsonRoutes.sendResult(res, {
                  code: 401,
                  data: {
                    error: 'An unknown error occured',
                  },
                });
              }
            })
          );
        }
      })
    );
  })
);

JsonRoutes.add('get', '/api/hyperion/download', function(req, res, next) {
  let hash = req.query.hash;
  let ipfs_connection = Config.getHyperionConnectionDetails(req.query.location);
  const ipfs = ipfsAPI(ipfs_connection[0], ipfs_connection[1], { protocol: 'http' });
  var ipfsCluster = ipfsClusterAPI(ipfs_connection[0], ipfs_connection[2], { protocol: 'http' });
  ipfs.files.get(hash, (err, files) => {
    if (files) {
      files.forEach(file => {
        if (file) {
          ChargeableAPI.insert({
            url: req.url,
            userId: req.userId,
            serviceType: 'hyperion',
            metadata: {
              type: 'DownloadFile',
              fileHash: hash,
              size: file.content.length,
              method: 'GET',
            },
          });
          res.end(file.content);
          return;
        }
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          error: 'File not found',
        },
      });
    }
  });
});

JsonRoutes.add('get', '/api/hyperion/fileStats', function(req, res, next) {
  let hash = req.query.hash;
  let ipfs_connection = Config.getHyperionConnectionDetails(req.query.location);
  const ipfs = ipfsAPI(ipfs_connection[0], ipfs_connection[1], { protocol: 'http' });
  var ipfsCluster = ipfsClusterAPI(ipfs_connection[0], ipfs_connection[2], { protocol: 'http' });
  ipfs.object.stat(hash, {}, (err, stats) => {
    if (!err && stats) {
      res.end(
        JSON.stringify({
          message: stats.DataSize,
        })
      );
    } else {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          error: 'File not found',
        },
      });
    }
  });
});

//while removing check if any other person has the same file uploaded or not. If not then only delete.
JsonRoutes.add('delete', '/api/hyperion/delete', (req, res, next) => {
  let hash = req.query.hash;
  let ipfs_connection = Config.getHyperionConnectionDetails(req.query.location);
  const ipfs = ipfsAPI(ipfs_connection[0], ipfs_connection[1], { protocol: 'http' });
  var ipfsCluster = ipfsClusterAPI(ipfs_connection[0], ipfs_connection[2], { protocol: 'http' });

  let file = Files.find({
    userId: req.userId,
    hash: hash,
    region: req.query.location,
  }).fetch();

  let total1 = file.length;

  let total2 = Files.find({
    hash: hash,
    region: req.query.location,
  }).fetch().length;

  if (total1 == 0) {
    JsonRoutes.sendResult(res, {
      code: 401,
      data: {
        error: "File doesn't exist",
      },
    });
  } else if (total1 == 1 && total2 == 1) {
    //remove from collection and ipfs

    ipfs.pin.rm(
      hash,
      {},
      Meteor.bindEnvironment((err, x) => {
        if (!err) {
          ipfsCluster.pin.rm(
            hash,
            {},
            Meteor.bindEnvironment((err, x) => {
              if (err) {
                JsonRoutes.sendResult(res, {
                  code: 401,
                  data: {
                    error: 'An unknown error occured',
                  },
                });
              } else {
                let newDiscount = 0;
                let thisMonth = new Date().getMonth();
                let thisYear = new Date().getFullYear();
                let fileAddedMonth = new Date(file[0].uploaded).getMonth();
                let fileAddedYear = new Date(file[0].uploaded).getFullYear();
                let fileAddedDay = new Date(file[0].uploaded).getUTCDate();

                if (thisMonth === fileAddedMonth && thisYear === fileAddedYear) {
                  let totalDaysThisMonth = helpers.daysInThisMonth();
                  let todayDay = new Date().getUTCDate();
                  let daysRemaining = totalDaysThisMonth - (todayDay - 1);
                  let daysIgnored = todayDay - 1;

                  const hyperionPricing = HyperionPricing.find({ active: true }).fetch()[0];
                  let costPerGBPerDay = helpers.hyperionGBCostPerDay(hyperionPricing.perGBCost);
                  let fileSizeInGB = file[0].size / 1024 / 1024 / 1024;
                  let fileCostPerDay = costPerGBPerDay * fileSizeInGB;
                  let costIgnored = daysIgnored * fileCostPerDay; //total discount that was given

                  newDisount = (totalDaysThisMonth - todayDay) * fileCostPerDay;
                }

                Files.remove({
                  userId: req.userId,
                  hash: hash,
                  region: req.query.location,
                });

                Hyperion.upsert(
                  {
                    userId: req.userId,
                  },
                  {
                    $inc: {
                      size: parseInt('-' + file[0].size),
                      discount: parseFloat(parseFloat('-' + newDisount.toString()).toPrecision(2)),
                    },
                  }
                );

                res.end(
                  JSON.stringify({
                    message: 'File removed successfully',
                  })
                );
              }
            })
          );
        } else {
          JsonRoutes.sendResult(res, {
            code: 401,
            data: {
              error: 'An unknown error occured',
            },
          });
        }
      })
    );
  } else if (total2 > 1) {
    //remove from collection only
    Files.remove({
      userId: req.userId,
      hash: hash,
      region: req.query.location,
    });

    let newDiscount = 0;
    let thisMonth = new Date().getMonth();
    let thisYear = new Date().getFullYear();
    let fileAddedMonth = new Date(file[0].uploaded).getMonth();
    let fileAddedYear = new Date(file[0].uploaded).getFullYear();
    let fileAddedDay = new Date(file[0].uploaded).getUTCDate();

    if (thisMonth === fileAddedMonth && thisYear === fileAddedYear) {
      let totalDaysThisMonth = helpers.daysInThisMonth();
      let todayDay = new Date().getUTCDate();
      let daysRemaining = totalDaysThisMonth - (todayDay - 1);
      let daysIgnored = todayDay - 1;

      const hyperionPricing = HyperionPricing.find({ active: true }).fetch()[0];
      let costPerGBPerDay = helpers.hyperionGBCostPerDay(hyperionPricing.perGBCost);
      let fileSizeInGB = file[0].size / 1024 / 1024 / 1024;
      let fileCostPerDay = costPerGBPerDay * fileSizeInGB;
      let costIgnored = daysIgnored * fileCostPerDay; //total discount that was given

      newDisount = (totalDaysThisMonth - todayDay) * fileCostPerDay;
    }

    Hyperion.upsert(
      {
        userId: req.userId,
      },
      {
        $inc: {
          size: parseInt('-' + file[0].size),
          discount: parseFloat(parseFloat('-' + newDisount.toString()).toPrecision(2)),
        },
      }
    );

    res.end(
      JSON.stringify({
        message: 'File removed successfully',
      })
    );
  }
});

//Hyperion.remove({});
//Files.remove({})

module.exports = {};
