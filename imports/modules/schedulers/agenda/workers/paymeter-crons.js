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
import Paymeter from '../../../../api/paymeter/index.js';
import {ERC20} from '../../../../collections/erc20/erc20.js';
import {CoinPrices} from '../../../../collections/coin-prices/coin-prices.js';
import {getTopERC20List, getCryptosPrice, getTokenInfoFromAddress} from '../../../../modules/paymeter/index.js'
import { Meteor } from 'meteor/meteor';

async function getGasPrice(url) {
  let web3 = new Web3(new Web3.providers.WebsocketProvider(url));

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

async function latestBlock(web3) {
  return new Promise((resolve, reject) => {
    web3.eth.getBlockNumber((error, result) => {
      if(!error && result) {
        resolve(result)
      } else {
        reject()
      }
    })
  })
}

async function getBlock(blockNumber, web3) {
  return new Promise((resolve, reject) => {
    web3.eth.getBlock(blockNumber, (error, result) => {
      if(!error && result) {
        resolve(result)
      } else {
        reject()
      }
    })
  })
}

async function sendRawTxn(txn, web3) {
  return new Promise((resolve, reject) => {
    web3.eth.sendSignedTransaction(txn, (error, hash) => {
      if(error) {
        reject()
      } else {
        resolve(hash)
      }
    })
  })
}

async function getETHTransaction(txn, web3) {
  return new Promise((resolve, reject) => {
    web3.eth.getTransaction(txn, (error, details) => {
      if(error) {
        reject()
      } else {
        resolve(details)
      }
    })
  })
}

async function getEthTxnConfirmations(url, txnHash) {
  let web3 = new Web3(new Web3.providers.WebsocketProvider(url));

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

//add filter network later
async function getDistinctERC20(network) {
  return new Promise((resolve, reject) => {
    ERC20.rawCollection().distinct('address', {network: network}).then(distinctValues => resolve(distinctValues))
  })
}

async function getERC20Events(web3, contractAddress, blockNumber) {
  return new Promise((resolve, reject) => {
    let ERC20_Contract_Instance = new web3.eth.Contract(Paymeter.erc20ABI, contractAddress);
    ERC20_Contract_Instance.getPastEvents('Transfer', {
      fromBlock: blockNumber,
      toBlock: blockNumber
    }, (error, logs) => {
      if(!error) {
        resolve(logs)
      } else {
        reject(error)
      }
    })
  })
}

async function getAndUpdateERC20ContractSymbol(contractAddress, network) {
  return new Promise(async (resolve, reject) => {
    try {
      let info = await getTokenInfoFromAddress(contractAddress)
      if(info.error) {
        if(info.error.message == 'Invalid address format') {
          ERC20.insert({
            address: contractAddress,
            network: network
          })

          reject()
        } else {
          reject(info.error)
        }
      } else {
        ERC20.upsert({
          address: contractAddress
        }, {
          $set: {
            symbol: info.symbol,
            network: network
          }
        })

        let prices = await getCryptosPrice(info.symbol)

        for(let coin in prices.data.data) {
          CoinPrices.upsert({
            symbol: info.symbol
          }, {
            $set: {
              usd_price: prices.data.data[coin].quote.USD.price,
              last_updated: Date.now()
            }
          })
        }

        resolve(prices.data.data[coin].quote.USD.price)
      }
    } catch(e) {
      reject(e)  
    }
  })
}

module.exports = function(agenda) {
  agenda.define('process withdrawls', {
    concurrency: 1
  }, async (job, done) => {
    function reSchedule() {
      done()
      agenda.schedule(new Date(Date.now() + 12000), 'process withdrawls');
    }

    try {
      let pending_txns = WalletTransactions.find({
        $or: [
          {status: "pending"},
          {status: "processing"}
        ],
        type: 'withdrawal'
        
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
          let web3 = new Web3(new Web3.providers.WebsocketProvider(url));
          if(pending_txns[count].feeDepositWallet) {
            if(pending_txns[count].status === 'processing') {
              let confirmations = await getEthTxnConfirmations(url, pending_txns[count].feeDepositTxnId)
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

  agenda.define('scan eth block testnet', {
    concurrency: 1
  }, async (job, done) => {

    function reSchedule() {
      done()
      agenda.schedule(new Date(Date.now() + (1000 * 1)), 'scan eth block testnet'); //after 1 seconds
    }

    try {
      let testnet_url = await Config.getPaymeterConnectionDetails('eth', 'testnet')
      let provider = new Web3.providers.WebsocketProvider(testnet_url)
      let testnet_web3 = new Web3(provider)
 
      let last_block = Utilities.findOne({
        key: "testnet-eth-last-scanned-block"
      })

      let block = null;


      if(last_block) {
        last_block = last_block.value;
        block = await getBlock(last_block + 1, testnet_web3)
      } else {
        let latest_block_number = await latestBlock(testnet_web3)
        block = await getBlock(latest_block_number, testnet_web3)

        Utilities.upsert({
          key: "testnet-eth-last-scanned-block"
        }, {
          $set: {
            value: latest_block_number
          }
        })
      }

      if(block.transactions) {
        for(let count = 0; count < block.transactions.length; count++) {
          let txn_details = await getETHTransaction(block.transactions[count], testnet_web3)
          if(txn_details.to) {
            let to_exists_internally = Wallets.findOne({
              coinType: 'ETH',
              network: 'testnet',
              address: txn_details.to.toLowerCase()
            })
  
            if(to_exists_internally) {
              WalletTransactions.upsert({
                toWallet: to_exists_internally._id,
                fromAddress: txn_details.from.toLowerCase(),
                amount: txn_details.value.toString(),
                createdAt: block.timestamp,
                status: 'pending',
                txnId: block.transactions[count],
                type: 'deposit',
                coinType: 'ETH'
              }, {
                $set: {
                  value: testnet_web3.utils.fromWei(txn_details.value, 'ether').toString()
                }
              });
            }
          }
        }
      }

      //detect erc20 deposits
      let erc20_contracts_addresses = await getDistinctERC20('testnet')

      for(let count = 0; count < erc20_contracts_addresses.length; count++) {
        let logs = await getERC20Events(testnet_web3, erc20_contracts_addresses[count], block.number)
        for (var iii = 0; iii < logs.length; iii++) {
          let fromAddressOfEvent = logs[iii].returnValues.from.toLowerCase()
          let toAddressOfEvent = logs[iii].returnValues.to.toLowerCase()
          let amountOfEvent = logs[iii].returnValues.value

          let to_exists_internally = Wallets.findOne({
            coinType: 'ERC20',
            network: 'testnet',
            address: toAddressOfEvent,
            contractAddress: erc20_contracts_addresses[count]
          })
          
          if(to_exists_internally) {
            WalletTransactions.upsert({
              toWallet: to_exists_internally._id,
              fromAddress: fromAddressOfEvent,
              createdAt: block.timestamp,
              status: 'pending',
              txnId: logs[iii].transactionHash,
              type: 'deposit',
              coinType: 'ERC20'
            }, {
              $set: {
                amount: testnet_web3.utils.fromWei(amountOfEvent, 'ether').toString()
              }
            });
          }
        }
      }

      Utilities.upsert({
        key: "testnet-eth-last-scanned-block"
      }, {
        $set: {
          value: last_block + 1
        }
      })

      reSchedule()
    } catch(e) {
      console.log(e)
      reSchedule()
    }
  })

  agenda.define('update gas price', {
    concurrency: 1
  }, async (job, done) => {

    function reSchedule() {
      done()
      agenda.schedule(new Date(Date.now() + (1000 * 300)), 'update gas price'); //asfter 5 minutes
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
      reSchedule()
    } catch(e) {
      reSchedule()
    }
  });

  agenda.define('update prices', {
    concurrency: 1
  }, async (job, done) => {
    function reSchedule() {
      done()

      if (['production'].includes(process.env.NODE_ENV)) {
        agenda.schedule(new Date(Date.now() + (1000 * 60 * 5)), 'update prices'); //after 5 minutes update price of all coins. if we do 1 call per 5 minutes then we can achieve below 10k calls per month as per as coinmarketcap limits. 
      } else {
        agenda.schedule('12 hours', 'update prices')
      }
    }

    try {
      let symbols_list = ['ETH'] //add other coins here

      let erc20_coins = ERC20.find({
        symbol: {
          $exists: true
        },
        network: "mainnet"
      }).fetch()

      erc20_coins.forEach((erc20_token) => {
        symbols_list.push(erc20_token.symbol)
      })

      symbols_list = symbols_list.join()

      let prices = await getCryptosPrice(symbols_list)
      for(let coin in prices.data.data) {
        CoinPrices.upsert({
          symbol: coin
        }, {
          $set: {
            usd_price: prices.data.data[coin].quote.USD.price,
            last_updated: Date.now()
          }
        })
      }

      reSchedule()
    } catch(e) {
      console.log(e)
      reSchedule()
    }
  });

  agenda.define('scan eth block mainnet', {
    concurrency: 1
  }, async (job, done) => {

    function reSchedule() {
      done()
      agenda.schedule(new Date(Date.now() + (1000 * 1)), 'scan eth block mainnet'); //after 3 seconds
    }

    try {
      let mainnet_url = await Config.getPaymeterConnectionDetails('eth', 'mainnet')
      let mainnet_web3 = new Web3(new Web3.providers.WebsocketProvider(mainnet_url));

      let last_block = Utilities.findOne({
        key: "mainnet-eth-last-scanned-block"
      })
      
      let block = null;

      if(last_block) {
        last_block = last_block.value;
        block = await getBlock(last_block + 1, mainnet_web3)
      } else {
        let latest_block_number = await latestBlock(mainnet_web3)
        block = await getBlock(latest_block_number, mainnet_web3)

        Utilities.upsert({
          key: "mainnet-eth-last-scanned-block"
        }, {
          $set: {
            value: latest_block_number
          }
        })
      }

      if(block.transactions) {
        for(let count = 0; count < block.transactions.length; count++) {
          let txn_details = await getETHTransaction(block.transactions[count], mainnet_web3)

          let from_exists_internally = Wallets.findOne({
            coinType: 'ETH',
            network: 'mainnet',
            address: txn_details.from.toLowerCase()
          })

          if(from_exists_internally) {
            if(txn_details.to) {
              let to_exists_internally = Wallets.findOne({
                coinType: 'ETH',
                network: 'mainnet',
                address: txn_details.to.toLowerCase()
              })
  
              if(to_exists_internally) {
                WalletTransactions.upsert({
                  toWallet: to_exists_internally._id,
                  fromAddress: txn_details.from.toLowerCase(),
                  amount: txn_details.value.toString(),
                  createdAt: block.timestamp,
                  status: 'pending',
                  txnId: block.transactions[count],
                  type: 'deposit',
                  coinType: 'ETH'
                }, {
                  $set: {
                    value: mainnet_web3.utils.fromWei(txn_details.value, 'ether').toString()
                  }
                });
              }
            }
          } else {
            if(txn_details.to) {
              let to_exists_internally = Wallets.findOne({
                coinType: 'ETH',
                network: 'mainnet',
                address: txn_details.to.toLowerCase()
              })
  
              if(to_exists_internally) {
                //came from outside. show deposit and charge user
                let eth_price = CoinPrices.findOne({
                  'symbol': 'ETH'
                })
  
                if(eth_price.usd_price && helpers.minutesDifference(Date.now(), block.timestamp * 1000) < 6) {
                  WalletTransactions.upsert({
                    toWallet: to_exists_internally._id,
                    fromAddress: txn_details.from.toLowerCase(),
                    createdAt: block.timestamp * 1000,
                    status: 'pending',
                    txnId: block.transactions[count],
                    type: 'deposit',
                    coinType: 'ETH',
                    usdCharged: ((0.15 * ((mainnet_web3.utils.fromWei(txn_details.value, 'ether').toString()) * eth_price.usd_price)) / 100),
                    usdPrice: eth_price.usd_price
                  }, {
                    $set: {
                      amount: mainnet_web3.utils.fromWei(txn_details.value, 'ether').toString(),
                    }
                  });
                } else {
                  //this may happen when coinmarketcap API not working or txn detected before price update on DB (i.e., old price in DB)
                  //in this case we just charge $0.20
                  //in future get coinmarketcap premium API and find the historical value and calculate fees using it.
                  WalletTransactions.upsert({
                    toWallet: to_exists_internally._id,
                    fromAddress: txn_details.from.toLowerCase(),
                    createdAt: block.timestamp * 1000,
                    status: 'pending',
                    txnId: block.transactions[count],
                    type: 'deposit',
                    coinType: 'ETH',
                    usdCharged: "0.20"
                  }, {
                    $set: {
                      amount: mainnet_web3.utils.fromWei(txn_details.value, 'ether').toString(),
                    }
                  });
                }
              }
            }
          }
        }
      }

      //detect erc20 deposits
      let erc20_contracts_addresses = await getDistinctERC20('mainnet')
      
      for(let count = 0; count < erc20_contracts_addresses.length; count++) {
        let logs = await getERC20Events(mainnet_web3, erc20_contracts_addresses[count], block.number)

        for (var iii = 0; iii < logs.length; iii++) {
          let fromAddressOfEvent = logs[iii].returnValues.from.toLowerCase()
          let toAddressOfEvent = logs[iii].returnValues.to.toLowerCase()
          let amountOfEvent = logs[iii].returnValues.value.toString()

          let from_exists_internally = Wallets.findOne({
            coinType: 'ERC20',
            network: 'mainnet',
            address: fromAddressOfEvent,
            contractAddress: erc20_contracts_addresses[count]
          })

          if(from_exists_internally) {
            let to_exists_internally = Wallets.findOne({
              coinType: 'ERC20',
              network: 'mainnet',
              address: toAddressOfEvent,
              contractAddress: erc20_contracts_addresses[count]
            })

            if(to_exists_internally) {
              WalletTransactions.upsert({
                toWallet: to_exists_internally._id,
                fromAddress: fromAddressOfEvent.toLowerCase(),
                createdAt: block.timestamp,
                status: 'pending',
                txnId: logs[iii].transactionHash,
                type: 'deposit',
                coinType: 'ERC20'
              }, {
                $set: {
                  amount: mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString()
                }
              });
            }
          } else {
            let to_exists_internally = Wallets.findOne({
              coinType: 'ETH',
              network: 'mainnet',
              address: block.transactions[count].to.toLowerCase()
            })

            if(to_exists_internally) {
              let erc20_info = ERC20.findOne({
                address: erc20_contracts_addresses[count]
              })

              if(erc20_info) {
                if(erc20_info.symbol) {
                  let token_price = CoinPrices.findOne({
                    'symbol': erc20_info.symbol
                  })

                  if(token_price.usd_price) {
                    WalletTransactions.upsert({
                      toWallet: to_exists_internally._id,
                      fromAddress: fromAddressOfEvent.toLowerCase(),
                      createdAt: block.timestamp * 1000,
                      status: 'pending',
                      txnId: block.transactions[count],
                      type: 'deposit',
                      coinType: 'ERC20',
                      usdCharged: ((0.15 * ((mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString()) * token_price.usd_price)) / 100),
                      usdPrice: token_price.usd_price
                    }, {
                      $set: {
                        amount: mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString(),
                      }
                    });
                  } else {
                    WalletTransactions.upsert({
                      toWallet: to_exists_internally._id,
                      fromAddress: fromAddressOfEvent.toLowerCase(),
                      createdAt: block.timestamp * 1000,
                      status: 'pending',
                      txnId: block.transactions[count],
                      type: 'deposit',
                      coinType: 'ERC20',
                      usdCharged: "0.20",
                    }, {
                      $set: {
                        amount: mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString(),
                      }
                    });
                  }
                } else {
                  WalletTransactions.upsert({
                    toWallet: to_exists_internally._id,
                    fromAddress: fromAddressOfEvent.toLowerCase(),
                    createdAt: block.timestamp * 1000,
                    status: 'pending',
                    txnId: block.transactions[count],
                    type: 'deposit',
                    coinType: 'ERC20',
                    usdCharged: "0.20",
                  }, {
                    $set: {
                      amount: mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString(),
                    }
                  });
                }
              } else {
                //make ethploroer call and find token symbol
                try {
                  let price = await getAndUpdateERC20ContractSymbol(erc20_contracts_addresses[count], "mainnet")
                  WalletTransactions.upsert({
                    toWallet: to_exists_internally._id,
                    fromAddress: fromAddressOfEvent.toLowerCase(),
                    createdAt: block.timestamp * 1000,
                    status: 'pending',
                    txnId: block.transactions[count],
                    type: 'deposit',
                    coinType: 'ERC20',
                    usdCharged: ((0.15 * ((mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString()) * price)) / 100),
                    usdPrice: price
                  }, {
                    $set: {
                      amount: mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString(),
                    }
                  });
                } catch(e) {
                  WalletTransactions.upsert({
                    toWallet: to_exists_internally._id,
                    fromAddress: fromAddressOfEvent.toLowerCase(),
                    createdAt: block.timestamp * 1000,
                    status: 'pending',
                    txnId: block.transactions[count],
                    type: 'deposit',
                    coinType: 'ERC20',
                    usdCharged: "0.20",
                  }, {
                    $set: {
                      amount: mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString(),
                    }
                  });
                }
              }
            }
          }
        }
      }

      Utilities.upsert({
        key: "mainnet-eth-last-scanned-block"
      }, {
        $set: {
          value: last_block + 1
        }
      })

      reSchedule()
    } catch(e) {
      reSchedule()
    }
  });

  

  (async () => {
    agenda.cancel({name: 'process withdrawls'})
    agenda.cancel({name: 'process deposits'}) //here once txn is confirmed we will bill the fee
    agenda.cancel({name: 'update gas price'})
    agenda.cancel({name: 'update prices'})
    agenda.cancel({name: 'add symbol to contracts'})
    agenda.cancel({name: 'scan eth block mainnet'})
    agenda.cancel({name: 'scan eth block testnet'})
    agenda.schedule('5 seconds', 'process withdrawls')
    agenda.schedule('5 seconds', 'process deposits')
    agenda.schedule('5 seconds', 'update gas price')
    agenda.schedule('60 minutes', 'add symbol to contracts') //purpose is if a contract is not found on ethploroer today but later if it's found then 0.15% should be charged
    agenda.schedule('3 seconds', 'scan eth block mainnet')
    agenda.schedule('3 seconds', 'scan eth block testnet')

    if (['production'].includes(process.env.NODE_ENV)) {
      agenda.schedule('5 seconds', 'update prices')
    } else {
      if(CoinPrices.find({}).count() > 0) {
        agenda.schedule('24 hours', 'update prices')
      }
    }
  })();
};

Utilities.upsert({
  key: "testnet-eth-last-scanned-block"
}, {
  $set: {
    value: 3519410
  }
})