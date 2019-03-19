import { Files } from '../collections/files/files.js';
import AuthMiddleware from './middleware/auth';
const BigNumber = require('bignumber.js');
import helpers from '../modules/helpers';
import Config from '../modules/config/server';
const ipfsAPI = require('ipfs-api');
const fs = require('fs');
var ipfsClusterAPI = require('ipfs-cluster-api');
import ChargeableAPI from '../collections/chargeable-apis/';
import { Hyperion } from '../collections/hyperion/hyperion';
import HyperionBillHistory from '../collections/hyperion/hyperion-bill-history';
var multer = require('multer');
var upload = multer(); //in case of scalibility issue use multer file storage. By default it uses memory.
var Future = Npm.require('fibers/future');
import Billing from './billing';
import moment from 'moment';
import Voucher from './network/voucher';
import HyperionPricing from '../collections/pricing/hyperion';

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
  subscribeForHyperion: async () => {
    const isPaymentMethodVerified = await Billing.isPaymentMethodVerified(Meteor.userId());

    if (isPaymentMethodVerified) {
      let hyperion_userData = Hyperion.findOne({ userId: Meteor.userId() });

      if (hyperion_userData) {
        if (hyperion_userData.unsubscribeNextMonth) {
          Hyperion.upsert(
            {
              userId: Meteor.userId(),
            },
            {
              $set: {
                subscribed: true,
                unsubscribeNextMonth: false,
              },
              $push: {
                subscriptions: {
                  action: 'subscribe',
                  at: new Date(),
                },
              },
              $unset: {
                subscriptionTill: '',
              },
            }
          );
        } else {
          let totalDaysThisMonth = helpers.daysInThisMonth();

          const hyperionPricing = HyperionPricing.find({ active: true }).fetch()[0];
          let perDayCost = new BigNumber(hyperionPricing.minimumMonthlyCost).dividedBy(totalDaysThisMonth);
          let minimumFeeThisMonth = new BigNumber(perDayCost).times(helpers.getRemainingDays() + 1); //including today
          Hyperion.upsert(
            {
              userId: Meteor.userId(),
            },
            {
              $set: {
                subscribed: true,
                unsubscribeNextMonth: false,
                minimumFeeThisMonth: minimumFeeThisMonth.toString(),
              },
              $push: {
                subscriptions: {
                  action: 'subscribe',
                  at: new Date(),
                },
              },
              $unset: {
                subscriptionTill: '',
              },
            }
          );
        }
      } else {
        let totalDaysThisMonth = helpers.daysInThisMonth();
        const hyperionPricing = HyperionPricing.find({ active: true }).fetch()[0];
        let perDayCost = new BigNumber(hyperionPricing.minimumMonthlyCost).dividedBy(totalDaysThisMonth);
        let minimumFeeThisMonth = new BigNumber(perDayCost).times(helpers.getRemainingDays() + 1); //including today
        Hyperion.upsert(
          {
            userId: Meteor.userId(),
          },
          {
            $set: {
              subscribed: true,
              unsubscribeNextMonth: false,
              minimumFeeThisMonth: minimumFeeThisMonth.toString(),
            },
            $push: {
              subscriptions: {
                action: 'subscribe',
                at: new Date(),
              },
            },
            $unset: {
              subscriptionTill: '',
            },
          }
        );
      }
    } else {
      throw new Meteor.Error('Please add card', 'Please add card');
    }
  },
  unsubscribeFromHyperion: async () => {
    const isPaymentMethodVerified = await Billing.isPaymentMethodVerified(Meteor.userId());

    if (Meteor.userId()) {
      if (isPaymentMethodVerified) {
        Hyperion.upsert(
          {
            userId: Meteor.userId(),
          },
          {
            $set: {
              unsubscribeNextMonth: true,
              subscriptionTill: moment()
                .endOf('month')
                .toDate(),
            },
            $push: {
              subscriptions: {
                action: 'unsubscribe',
                at: new Date(),
              },
            },
          }
        );
      } else {
        throw new Meteor.Error('Please add card', 'Please add card');
      }
    } else {
      throw new Meteor.Error('Please login', 'Please login');
    }
  },
});

function hyperion_getAndResetUserBill({ userId, isFromFrontEnd, selectedMonth }) {
  selectedMonth = selectedMonth || moment();
  if (userId) {
    const billingPeriodLabel = selectedMonth.format('MMM-YYYY');
    let total_hyperion_cost = 0; //add this value to invoice amount
    const hyperion_stats = Hyperion.findOne({
      userId: userId,
    });

    if (hyperion_stats) {
      // Since for billing, if the user unsubscribes on last day then bill will become 0
      // if (hyperion_stats.subscribed) {
      const hyperionPricing = HyperionPricing.find({ active: true }).fetch()[0];
      const totalDaysThisMonth = helpers.daysInThisMonth();
      const costPerGBPerDay = helpers.hyperionGBCostPerDay(hyperionPricing.perGBCost);
      const fileSizeInGB = new BigNumber(hyperion_stats.size || 0)
        .dividedBy(1024)
        .dividedBy(1024)
        .dividedBy(1024);
      const fileCostPerDay = new BigNumber(costPerGBPerDay).times(fileSizeInGB);
      total_hyperion_cost = new BigNumber(totalDaysThisMonth).times(fileCostPerDay);
      total_hyperion_cost = new BigNumber(total_hyperion_cost).minus(new BigNumber(hyperion_stats.discount));

      let nextMonthMin = new BigNumber(hyperionPricing.minimumMonthlyCost);

      if (hyperion_stats.unsubscribeNextMonth) {
        Hyperion.upsert(
          {
            userId: userId,
          },
          {
            $set: {
              subscribed: false,
              unsubscribeNextMonth: false,
            },
          }
        );

        nextMonthMin = new BigNumber(0);
      }

      if (new BigNumber(total_hyperion_cost).lt(new BigNumber(hyperion_stats.minimumFeeThisMonth))) {
        total_hyperion_cost = new BigNumber(hyperion_stats.minimumFeeThisMonth);
      }

      const vouchers = hyperion_stats.vouchers;
      let discount = 0;
      let discountsApplied = [];
      if (vouchers) {
        vouchers
          .sort((a, b) => new Date(a.appliedOn).getTime() - new Date(b.appliedOn).getDate())
          .filter(voucher => () => {
            if (selectedMonth.diff(moment(voucher.appliedOn), 'months') > voucher.usability.no_months) {
              return false;
            }
            return true;
          })
          .forEach(voucher => {
            const _discount = Number(Voucher.getDiscountAmountForVoucher(voucher, total_hyperion_cost));
            if (_discount > total_hyperion_cost - discount && _discount > 0) {
              _discount = total_hyperion_cost - discount;
              discountsApplied.push({ _id: voucher._id, code: voucher.code, amount: _discount });
            }
            discount = discount + _discount;
          });
        total_hyperion_cost = Math.max(0, total_hyperion_cost - discount);
      }

      const history = HyperionBillHistory.find({ billingPeriodLabel, userId }).fetch()[0];
      if (history) {
        return { bill: history.bill, discount: history.totalDiscountGiven };
      } else if (!isFromFrontEnd) {
        delete hyperion_stats.subscriptions;
        delete hyperion_stats.userId;
        HyperionBillHistory.insert({
          billingPeriodLabel,
          userId,
          bill: Number(total_hyperion_cost),
          metadata: hyperion_stats,
          discountsApplied,
          totalDiscountGiven: discount,
        });
      }

      // Reset it to 0 only if call is via generate bill script i.e. from backend
      if (!isFromFrontEnd) {
        Hyperion.upsert(
          {
            userId: userId,
          },
          {
            $set: {
              bill: '0',
              minimumFeeThisMonth: Number(nextMonthMin),
            },
          }
        );
      }
      return { bill: Number(total_hyperion_cost).toFixed(2), discount };
    } else {
      return { bill: 0, discount: 0 };
    }
  } else {
    return { bill: 0, discount: 0 };
  }
}

function isUserSubscribedToHyperion(userId) {
  let obj = Hyperion.findOne({
    userId: userId,
  });

  if (obj) {
    if (obj.subscribed) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

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
JsonRoutes.Middleware.use('/api/hyperion/download', authMiddleware);
JsonRoutes.Middleware.use('/api/hyperion/fileStats', authMiddleware);
JsonRoutes.Middleware.use('/api/hyperion/delete', authMiddleware);
JsonRoutes.Middleware.use('/api/hyperion/logout', authMiddleware);
JsonRoutes.Middleware.use('/api/hyperion/upload', upload.single('file'));

JsonRoutes.add(
  'post',
  '/api/hyperion/upload',
  Meteor.bindEnvironment(async (req, res, next) => {
    const isPaymentMethodVerified = await Billing.isPaymentMethodVerified(req.userId);

    if (isPaymentMethodVerified) {
      if (isUserSubscribedToHyperion(req.userId)) {
        let ipfs_connection = Config.getHyperionConnectionDetails(req.body.location || req.query.location);
        const ipfs = ipfsAPI(ipfs_connection[0], ipfs_connection[1], { protocol: 'http' });
        var ipfsCluster = ipfsClusterAPI(ipfs_connection[0], ipfs_connection[2], { protocol: 'http' });
        ipfs.files.add(
          req.file.buffer,
          Meteor.bindEnvironment((err, file) => {
            if (err) {
              console.log(err);
              return JsonRoutes.sendResult(res, {
                code: 401,
                data: {
                  error: err.toString(),
                },
              });
            }
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
                    let fileSizeInGB = new BigNumber(req.file.size)
                      .div(1024)
                      .div(1024)
                      .div(1024)
                      .toNumber();
                    let fileCostPerDay = new BigNumber(costPerGBPerDay).times(fileSizeInGB).toNumber();
                    let costIgnored = new BigNumber(daysIgnored).times(fileCostPerDay).toNumber();

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

                    JsonRoutes.sendResult(res, {
                      code: 200,
                      data: {
                        message: `${file[0].hash}`,
                        success: true,
                      },
                    });
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
                      error: err.toString(),
                    },
                  });
                }
              })
            );
          })
        );
      } else {
        JsonRoutes.sendResult(res, {
          code: 401,
          data: {
            error: 'Please subscribe',
          },
        });
      }
    } else {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          error: 'Verify your payment method',
        },
      });
    }
  })
);

JsonRoutes.add('get', '/api/hyperion/download', async (req, res, next) => {
  const isPaymentMethodVerified = await Billing.isPaymentMethodVerified(req.userId);

  if (isPaymentMethodVerified) {
    if (isUserSubscribedToHyperion(req.userId)) {
      let hash = req.query.hash;
      let ipfs_connection = Config.getHyperionConnectionDetails(req.query.location);
      const ipfs = ipfsAPI(ipfs_connection[0], ipfs_connection[1], { protocol: 'http' });
      var ipfsCluster = ipfsClusterAPI(ipfs_connection[0], ipfs_connection[2], { protocol: 'http' });
      ipfs.files.get(
        hash,
        Meteor.bindEnvironment((err, files) => {
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
        })
      );
    } else {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          error: 'Please subscribe',
        },
      });
    }
  } else {
    JsonRoutes.sendResult(res, {
      code: 401,
      data: {
        error: 'Verify your payment method',
      },
    });
  }
});

JsonRoutes.add('get', '/api/hyperion/fileStats', async (req, res, next) => {
  const isPaymentMethodVerified = await Billing.isPaymentMethodVerified(req.userId);

  if (isPaymentMethodVerified) {
    if (isUserSubscribedToHyperion(req.userId)) {
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
    } else {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          error: 'Please subscribe',
        },
      });
    }
  } else {
    JsonRoutes.sendResult(res, {
      code: 401,
      data: {
        error: 'Verify your payment method',
      },
    });
  }
});

//while removing check if any other person has the same file uploaded or not. If not then only delete.
JsonRoutes.add('delete', '/api/hyperion/delete', async (req, res, next) => {
  const isPaymentMethodVerified = await Billing.isPaymentMethodVerified(req.userId);

  if (isPaymentMethodVerified) {
    if (isUserSubscribedToHyperion(req.userId)) {
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
                        error: err.toString(),
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
                      let fileSizeInGB = new BigNumber(file[0].size)
                        .div(1024)
                        .div(1024)
                        .div(1024)
                        .toNumber();
                      let fileCostPerDay = new BigNumber(costPerGBPerDay).times(fileSizeInGB).toNumber();
                      let costIgnored = new BigNumber(daysIgnored).times(fileCostPerDay).toNumber(); //total discount that was given

                      newDisount = new BigNumber(totalDaysThisMonth)
                        .minus(todayDay)
                        .times(fileCostPerDay)
                        .toNumber();
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
                          size: new BigNumber('-' + file[0].size).toNumber(),
                          discount: new BigNumber('-' + newDisount.toString()).toNumber(),
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
                  error: err.toString(),
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
          let fileSizeInGB = new BigNumber(file[0].size)
            .div(1024)
            .div(1024)
            .div(1024)
            .toNumber();
          let fileCostPerDay = new BigNumber(costPerGBPerDay).times(fileSizeInGB).toNumber();
          let costIgnored = new BigNumber(daysIgnored).times(fileCostPerDay).toNumber(); //total discount that was given

          newDisount = new BigNumber(totalDaysThisMonth)
            .minus(todayDay)
            .times(fileCostPerDay)
            .toNumber();
        }

        Hyperion.upsert(
          {
            userId: req.userId,
          },
          {
            $inc: {
              size: new BigNumber('-' + file[0].size).toNumber(),
              discount: new BigNumber('-' + newDisount.toString()).toNumber(),
            },
          }
        );

        ChargeableAPI.insert({
          url: req.url,
          userId: req.userId,
          serviceType: 'hyperion',
          metadata: {
            type: 'DeleteFile',
            fileHash: hash,
            size: file.content.length,
            method: 'DELETE',
          },
        });
        res.end(
          JSON.stringify({
            message: 'File removed successfully',
          })
        );
      }
    } else {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          error: 'Please subscribe',
        },
      });
    }
  } else {
    JsonRoutes.sendResult(res, {
      code: 401,
      data: {
        error: 'Verify your payment method',
      },
    });
  }
});
module.exports = {
  getBill: hyperion_getAndResetUserBill,
};
