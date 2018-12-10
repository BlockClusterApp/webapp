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
  agenda.define('check confirmations', async (job, done) => {
    function reSchedule() {
      agenda.schedule(new Date(Date.now() + 12000), 'check confirmations');
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

          reSchedule();
        } else if(wallet.coinType === 'ERC20') {
          if(pending_txns[count].feeDepositWallet) {
            if(pending_txns[count].txnId === null) {
              //check if fee deposit txn id is confirmed....if yes they send the next txn
              let url = `${await Config.getPaymeterConnectionDetails("eth", wallet.network)}`;
              let confirmations = await getEthTxnConfirmations(url, pending_txns[count].feeDepositTxnId)
              if(confirmations >= 15) {
                let nonce = await Paymeter.getNonce(wallet.address, url)
                let gasPrice = pending_txns[count].feeDepositGasPrice;
                let web3 = new Web3(new Web3.providers.HttpProvider(url));
                
                let erc20 = web3.eth.contract(Paymeter.erc20ABI)
                let erc20_instance = erc20.at(wallet.contractAddress)
                let data = erc20_instance.transfer.getData(pending_txns[count].toAddress, web3.toWei(pending_txns[count].amount, 'ether'));
                let gasLimit = await estimateGas({
                  to: wallet.contractAddress,
                  data: data,
                  from: wallet.address
                }, web3)
              
                var rawTx = {
                  gasPrice: web3.toHex(gasPrice),
                  gasLimit: web3.toHex(gasLimit),
                  from: wallet.address,
                  nonce: web3.toHex(nonce),
                  to: wallet.contractAddress,
                  data: data,
                  value: web3.toHex(web3.toWei("0", 'ether'))
                };

                let tx = new EthereumTx(rawTx);
                const privateKey = Buffer.from(wallet.privateKey, 'hex')
                tx.sign(privateKey)
                const serializedTx = tx.serialize()

                let hash = await sendRawTxn("0x" + serializedTx.toString("hex"), web3);

                WalletTransactions.update({
                  _id: pending_txns[count]._id
                }, {
                  $set: {
                    status: "pending",
                    txnId: hash
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
            } else {
              //2nd txn already sent. wait for confirmation
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

          console.log("Rescheduled")
          reSchedule();
        }
      }

      reSchedule();
    } catch(e) {
      console.log(e)
      reSchedule();
    }
  });

  agenda.define('update gas price', async (job, done) => {
    function reSchedule() {
      agenda.schedule(new Date(Date.now() + (1000 * 300)), 'check confirmations');
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

  (() => {
    agenda.schedule('5 seconds', 'check confirmations');
    agenda.schedule('5 seconds', 'update gas price');
  })();
};