import moment from 'moment';
import {Utilities} from '../../../../collections/utilities/utilities.js';
import bullSystem from '../../bull';
import Config from '../../../../modules/config/server';
const Web3 = require('web3');
import {
  WalletTransactions
} from '../../../../collections/walletTransactions/walletTransactions.js'
import {
  Wallets
} from '../../../../collections/wallets/wallets.js'
import helpers from '../../../../modules/helpers';
const BigNumber = require('bignumber.js');
const EthereumTx = require('ethereumjs-tx')
import Paymeter from '../../../../api/paymeter.js';

async function getGasPrice(url) {
  let web3 = new Web3(new Web3.providers.HttpProvider(url));

  return new Promise((resolve, reject) => {
    web3.eth.getGasPrice((error, result) => {
      if(error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

async function estimateGas(obj, web3) {
  return new Promise((resolve, reject) => {
    web3.eth.estimateGas(obj, (err, gasLimit) => {
      if(err) {
        reject()
      } else {
        resolve(gasLimit)
      }
    })
  })
}

async function sendRawTxn(txn, web3) {
  return new Promise((resolve, reject) => {
    web3.eth.sendRawTransaction(txn, (error, hash) => {
      if(error) {
        reject()
      } else {
        resolve(hash)
      }
    })
  })
}

async function getEthTxnConfirmations(url, txnHash) {
  let web3 = new Web3(new Web3.providers.HttpProvider(url));

  return new Promise((resolve, reject) => {
    web3.eth.getBlockNumber((err, latestBlockNumber) => {
      if(err) {
        reject(err)
      } else {
        web3.eth.getTransactionReceipt(txnHash, (err, receipt) => {
          if(err) {
            reject(err)
          } else {
            if(receipt === null) {
              resolve(0)
            } else {
              resolve(latestBlockNumber - receipt.blockNumber)
            }
          }
        })
      }
    })
  })
}


module.exports = function(agenda) {
  agenda.define('process paymeter', {
    concurrency: 1
  }, async (job, done) => {
    function reSchedule() {
      done()
      agenda.schedule(new Date(Date.now() + 12000), 'process paymeter');
    }

    try {
      let pending_txns = WalletTransactions.find({
        $or: [
          {status: "pending"},
          {status: "processing"}
        ]
        
      }).fetch()

      for(let count = 0; count < pending_txns.length; count++) {
        let wallet_id = pending_txns[count].fromWallet
        let wallet = Wallets.findOne({
          _id: wallet_id
        })

        if(wallet.coinType === 'ETH') {
          let url = `${await Config.getPaymeterConnectionDetails("eth", wallet.network)}`;
          let confirmations = await getEthTxnConfirmations(url, pending_txns[count].txnId)
          if(confirmations >= 15) {
            WalletTransactions.update({
              _id: pending_txns[count]._id
            }, {
              $set: {
                status: "completed"
              }
            })
          } else if(helpers.daysDifference(Date.now(), pending_txns[count].createdAt) >= 1) {
            WalletTransactions.update({
              _id: pending_txns[count]._id
            }, {
              $set: {
                status: "cancelled"
              }
            })
          }
        } else if(wallet.coinType === 'ERC20') {
          let url = `${await Config.getPaymeterConnectionDetails("eth", wallet.network)}`;
          let web3 = new Web3(new Web3.providers.HttpProvider(url));
          if(pending_txns[count].feeDepositWallet) {
            if(pending_txns[count].status === 'processing') {
              console.log("Process")
              let confirmations = await getEthTxnConfirmations(url, pending_txns[count].feeDepositTxnId)
              console.log(confirmations)
              if(confirmations >= 15) {
                let prev_nonce_txn = WalletTransactions.findOne({
                  fromWallet: wallet._id,
                  nonce: pending_txns[count].nonce - 1 
                })
  
                if(prev_nonce_txn) {
                  if(prev_nonce_txn.status === 'pending' || prev_nonce_txn.status === 'completed') {
                    let hash = await sendRawTxn(pending_txns[count].rawTx, web3);
  
                    WalletTransactions.update({
                      _id: pending_txns[count]._id
                    }, {
                      $set: {
                        status: "pending",
                        txnId: hash
                      }
                    })
                  } else if(prev_nonce_txn.status === 'cancelled') {
                    WalletTransactions.update({
                      _id: pending_txns[count]._id
                    }, {
                      $set: {
                        status: "cancelled"
                      }
                    })
                  }
                } else {
                  //first indirect send of the wallet.
                  let hash = await sendRawTxn(pending_txns[count].rawTx, web3);
  
                  WalletTransactions.update({
                    _id: pending_txns[count]._id
                  }, {
                    $set: {
                      status: "pending",
                      txnId: hash
                    }
                  })
                }
              } else if(helpers.daysDifference(Date.now(), pending_txns[count].createdAt) >= 1) {
                WalletTransactions.update({
                  _id: pending_txns[count]._id
                }, {
                  $set: {
                    status: "cancelled"
                  }
                })
              }
            } else {
              let url = `${await Config.getPaymeterConnectionDetails("eth", wallet.network)}`;
              let confirmations = await getEthTxnConfirmations(url, pending_txns[count].txnId)

              if(confirmations >= 15) {
                WalletTransactions.update({
                  _id: pending_txns[count]._id
                }, {
                  $set: {
                    status: "completed"
                  }
                })
              } else if(helpers.daysDifference(Date.now(), pending_txns[count].createdAt) >= 1) {
                WalletTransactions.update({
                  _id: pending_txns[count]._id
                }, {
                  $set: {
                    status: "cancelled"
                  }
                })
              }
            }
          } else {
            if(pending_txns[count].status === 'processing') {
              //check if previous nonce is broadcasted
              let prev_nonce_txn = WalletTransactions.findOne({
                fromWallet: wallet._id,
                nonce: pending_txns[count].nonce - 1 
              })

              if(prev_nonce_txn) {
                if(prev_nonce_txn.status === 'pending' || prev_nonce_txn.status === 'completed') {
                  let hash = await sendRawTxn(pending_txns[count].rawTx, web3);
                  WalletTransactions.update({
                    _id: pending_txns[count]._id
                  }, {
                    $set: {
                      status: "pending",
                      txnId: hash
                    }
                  })
                } else if(prev_nonce_txn.status === 'cancelled') {
                  WalletTransactions.update({
                    _id: pending_txns[count]._id
                  }, {
                    $set: {
                      status: "cancelled"
                    }
                  })
                }
              }
            } else {
              let url = `${await Config.getPaymeterConnectionDetails("eth", wallet.network)}`;
              let confirmations = await getEthTxnConfirmations(url, pending_txns[count].txnId)
              if(confirmations >= 15) {
                WalletTransactions.update({
                  _id: pending_txns[count]._id
                }, {
                  $set: {
                    status: "completed"
                  }
                })
              } else if(helpers.daysDifference(Date.now(), pending_txns[count].createdAt) >= 1) {
                WalletTransactions.update({
                  _id: pending_txns[count]._id
                }, {
                  $set: {
                    status: "cancelled"
                  }
                })
              }
            }
          }
        }
      }
      reSchedule();
    } catch(e) {
      console.log(e)
      reSchedule();
    }
  });

  agenda.define('update gas price', {
    concurrency: 1
  }, async (job, done) => {
    function reSchedule() {
      done()
      agenda.schedule(new Date(Date.now() + (1000 * 300)), 'process paymeter');
    }

    try {
      let testnet_gasPrice = await getGasPrice(`${await Config.getPaymeterConnectionDetails("eth", "testnet")}`)
      Utilities.upsert({
        key: "testnet-gasPrice"
      }, {
        $set: {
          value: testnet_gasPrice.toString()
        }
      })

      let mainnet_gasPrice = await getGasPrice(`${await Config.getPaymeterConnectionDetails("eth", "mainnet")}`)

      Utilities.upsert({
        key: "mainnet-gasPrice"
      }, {
        $set: {
          value: mainnet_gasPrice.toString()
        }
      })
      agenda.schedule('5 minutes', 'update gas price');
    } catch(e) {
      agenda.schedule('5 minutes', 'update gas price');
    }
  });

  (async () => {
    agenda.cancel({name: 'process paymeter'})
    agenda.cancel({name: 'update gas price'})
    agenda.schedule('5 seconds', 'process paymeter');
    agenda.schedule('5 seconds', 'update gas price');
  })();
};