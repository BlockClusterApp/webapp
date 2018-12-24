import moment from 'moment';
import { Utilities } from '../../../../collections/utilities/utilities.js';
import bullSystem from '../../bull';
import Config from '../../../../modules/config/server';
const Web3 = require('web3');
import { WalletTransactions } from '../../../../collections/walletTransactions/walletTransactions.js';
import { Wallets } from '../../../../collections/wallets/wallets.js';
import { Paymeter as PaymeterCollection } from '../../../../collections/paymeter/paymeter.js';
import helpers from '../../../../modules/helpers';
import Paymeter from '../../../../api/paymeter/index.js';
import { ERC20 } from '../../../../collections/erc20/erc20.js';
import { CoinPrices } from '../../../../collections/coin-prices/coin-prices.js';
import { getTopERC20List, getCryptosPrice, getTokenInfoFromAddress } from '../../../../modules/paymeter/index.js';
import { Meteor } from 'meteor/meteor';
import sleep from 'await-sleep';
import BigNumber from 'bignumber.js';
var Future = Npm.require('fibers/future');
import { CRONjob } from 'meteor/ostrio:cron-jobs';

const db  = Meteor.users.rawDatabase();

const cron = new CRONjob({
  db: db,
  autoClear: true,
  resetOnInit: true //don't re-run pending tasks when restarted
});

let isPaymeterCronInitialized = false;

async function getGasPrice(url) {
  let web3 = new Web3(new Web3.providers.WebsocketProvider(url));

  return new Promise((resolve, reject) => {
    web3.eth.getGasPrice((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

async function estimateGas(obj, web3) {
  return new Promise((resolve, reject) => {
    web3.eth.estimateGas(obj, (err, gasLimit) => {
      if (err) {
        reject(err);
      } else {
        resolve(gasLimit);
      }
    });
  });
}

async function latestBlock(web3) {
  return new Promise((resolve, reject) => {
    web3.eth.getBlockNumber((error, result) => {
      if (!error && result) {
        resolve(result);
      } else {
        reject(error);
      }
    });
  });
}

async function getBlock(blockNumber, web3) {
  return new Promise((resolve, reject) => {
    web3.eth.getBlock(blockNumber, (error, result) => {
      if (!error && result) {
        resolve(result);
      } else {
        reject(error);
      }
    });
  });
}

async function sendRawTxn(txn, web3) {
  return new Promise((resolve, reject) => {
    web3.eth.sendSignedTransaction(txn, (error, hash) => {
      if (error) {
        reject(error);
      } else {
        resolve(hash);
      }
    });
  });
}

async function getETHTransaction(txn, web3) {
  return new Promise((resolve, reject) => {
    web3.eth.getTransaction(txn, (error, details) => {
      if (error) {
        reject(error);
      } else {
        resolve(details);
      }
    });
  });
}

async function getEthTxnConfirmations(url, txnHash) {
  let web3 = new Web3(new Web3.providers.WebsocketProvider(url));

  return new Promise((resolve, reject) => {
    web3.eth.getBlockNumber((err, latestBlockNumber) => {
      if (err) {
        reject(err);
      } else {
        web3.eth.getTransactionReceipt(txnHash, (err, receipt) => {
          if (err) {
            reject(err);
          } else {
            if (receipt === null) {
              resolve(0);
            } else {
              resolve(latestBlockNumber - receipt.blockNumber);
            }
          }
        });
      }
    });
  });
}

//add filter network later
async function getDistinctERC20(network) {
  return new Promise((resolve, reject) => {
    Wallets.rawCollection()
      .distinct('contractAddress', { network: network, coinType: 'ERC20' })
      .then(distinctValues => resolve(distinctValues));
  });
}

async function getERC20Events(web3, contractAddress, blockNumber) {
  return new Promise((resolve, reject) => {
    let ERC20_Contract_Instance = new web3.eth.Contract(Paymeter.erc20ABI, contractAddress);
    ERC20_Contract_Instance.getPastEvents(
      'Transfer',
      {
        fromBlock: blockNumber,
        toBlock: blockNumber,
      },
      (error, logs) => {
        if (!error) {
          resolve(logs);
        } else {
          reject(error);
        }
      }
    );
  });
}

async function getAndUpdateERC20ContractSymbol(contractAddress, network) {
  return new Promise(async (resolve, reject) => {
    try {
      let info = await getTokenInfoFromAddress(contractAddress);
      if (info.error) {
        if (info.error.message == 'Invalid address format') {
          ERC20.insert({
            address: contractAddress,
            network: network,
          });

          reject();
        } else {
          reject(info.error);
        }
      } else {
        ERC20.upsert(
          {
            address: contractAddress,
          },
          {
            $set: {
              symbol: info.symbol,
              network: network,
            },
          }
        );

        let prices = await getCryptosPrice(info.symbol);

        for (let coin in prices.data.data) {
          CoinPrices.upsert(
            {
              symbol: info.symbol,
            },
            {
              $set: {
                usd_price: prices.data.data[coin].quote.USD.price,
                last_updated: Date.now(),
              },
            }
          );

          resolve(prices.data.data[coin].quote.USD.price);

          return;
        }
      }
    } catch (e) {
      reject(e);
    }
  });
}

const updatePrices = async (ready) => {
  try {
    let symbols_list = ['ETH']; //add other coins here
    let erc20_coins = ERC20.find({
      symbol: {
        $exists: true,
      },
      network: 'mainnet',
    }).fetch();

    erc20_coins.forEach(erc20_token => {
      symbols_list.push(erc20_token.symbol);
    });

    symbols_list = symbols_list.join();
    let prices = await getCryptosPrice(symbols_list);

    for (let coin in prices.data.data) {
      CoinPrices.upsert(
        {
          symbol: coin,
        },
        {
          $set: {
            usd_price: prices.data.data[coin].quote.USD.price,
            last_updated: Date.now(),
          },
        }
      );
    }

    ready();
    if (['production'].includes(process.env.NODE_ENV)) {
      cron.setTimeout(Meteor.bindEnvironment(updatePrices), 1000 * 60 * 5, 'update prices')
    } else {
      cron.setTimeout(Meteor.bindEnvironment(updatePrices), 1000 * 60 * 60 * 12, 'update prices')
    }
  } catch (e) {
    ready();
    if (['production'].includes(process.env.NODE_ENV)) {
      cron.setTimeout(Meteor.bindEnvironment(updatePrices), 10000, 'update prices')
    } else {
      cron.setTimeout(Meteor.bindEnvironment(updatePrices), 1000 * 60 * 60 * 12, 'update prices')
    }
  }
};

const addSymbolToContracts = async (ready) => {
  try {
    let erc20_coins = ERC20.find({
      symbol: {
        $exists: false,
      },
      network: 'mainnet',
    }).fetch();

    for (let count = 0; count < erc20_coins.length; count++) {
      let info = await getTokenInfoFromAddress(erc20_coins.address);

      if (info.symbol) {
        ERC20.upsert(
          {
            address: contractAddress,
          },
          {
            $set: {
              symbol: info.symbol,
              network: 'mainnet',
            },
          }
        );

        let prices = await getCryptosPrice(info.symbol);

        for (let coin in prices.data.data) {
          CoinPrices.upsert(
            {
              symbol: info.symbol,
            },
            {
              $set: {
                usd_price: prices.data.data[coin].quote.USD.price,
                last_updated: Date.now(),
              },
            }
          );
        }
      }

      await sleep(3000);
    }

    ready();

  } catch (e) {
    ready();
  }
}

const processWithdrawls = async (ready) => {
  try {
    let pending_txns = WalletTransactions.find({
      $or: [{ status: 'pending' }, { status: 'processing' }],
      type: 'withdrawal',
    }).fetch();

    for (let count = 0; count < pending_txns.length; count++) {
      let wallet_id = pending_txns[count].fromWallet;
      let wallet = Wallets.findOne({
        _id: wallet_id,
      });

      if (wallet.coinType === 'ETH') {
        let url = `${await Config.getPaymeterConnectionDetails('eth', wallet.network)}`;
        let confirmations = await getEthTxnConfirmations(url, pending_txns[count].txnId);
        if (confirmations >= 15) {
          WalletTransactions.update(
            {
              _id: pending_txns[count]._id,
            },
            {
              $set: {
                status: 'completed',
              },
            }
          );

          Wallets.update(
            {
              _id: wallet._id,
            },
            {
              $set: {
                confirmedBalance: await Paymeter.getBalance(wallet._id),
              },
            }
          );
        } else if (helpers.daysDifference(Date.now(), pending_txns[count].createdAt) >= 1) {
          WalletTransactions.update(
            {
              _id: pending_txns[count]._id,
            },
            {
              $set: {
                status: 'cancelled',
              },
            }
          );

          Wallets.update(
            {
              _id: wallet._id,
            },
            {
              $set: {
                confirmedBalance: await Paymeter.getBalance(wallet._id),
              },
            }
          );
        }
      } else if (wallet.coinType === 'ERC20') {
        let url = `${await Config.getPaymeterConnectionDetails('eth', wallet.network)}`;
        let web3 = new Web3(new Web3.providers.WebsocketProvider(url));
        if (pending_txns[count].feeDepositWallet) {
          if (pending_txns[count].status === 'processing') {
            let confirmations = await getEthTxnConfirmations(url, pending_txns[count].feeDepositTxnId);
            if (confirmations >= 15) {
              let prev_nonce_txn = WalletTransactions.findOne({
                fromWallet: wallet._id,
                nonce: pending_txns[count].nonce - 1,
              });

              if (prev_nonce_txn) {
                if (prev_nonce_txn.status === 'pending' || prev_nonce_txn.status === 'completed') {
                  let hash = await sendRawTxn(pending_txns[count].rawTx, web3);

                  WalletTransactions.update(
                    {
                      _id: pending_txns[count]._id,
                    },
                    {
                      $set: {
                        status: 'pending',
                        txnId: hash,
                      },
                    }
                  );

                  Wallets.update(
                    {
                      _id: wallet._id,
                    },
                    {
                      $set: {
                        confirmedBalance: await Paymeter.getBalance(wallet._id),
                      },
                    }
                  );
                } else if (prev_nonce_txn.status === 'cancelled') {
                  WalletTransactions.update(
                    {
                      _id: pending_txns[count]._id,
                    },
                    {
                      $set: {
                        status: 'cancelled',
                      },
                    }
                  );

                  Wallets.update(
                    {
                      _id: wallet._id,
                    },
                    {
                      $set: {
                        confirmedBalance: await Paymeter.getBalance(wallet._id),
                      },
                    }
                  );
                }
              } else {
                //first indirect send of the wallet.
                let hash = await sendRawTxn(pending_txns[count].rawTx, web3);

                WalletTransactions.update(
                  {
                    _id: pending_txns[count]._id,
                  },
                  {
                    $set: {
                      status: 'pending',
                      txnId: hash,
                    },
                  }
                );

                Wallets.update(
                  {
                    _id: wallet._id,
                  },
                  {
                    $set: {
                      confirmedBalance: await Paymeter.getBalance(wallet._id),
                    },
                  }
                );
              }
            } else if (helpers.daysDifference(Date.now(), pending_txns[count].createdAt) >= 1) {
              WalletTransactions.update(
                {
                  _id: pending_txns[count]._id,
                },
                {
                  $set: {
                    status: 'cancelled',
                  },
                }
              );

              Wallets.update(
                {
                  _id: wallet._id,
                },
                {
                  $set: {
                    confirmedBalance: await Paymeter.getBalance(wallet._id),
                  },
                }
              );
            }
          } else {
            let url = `${await Config.getPaymeterConnectionDetails('eth', wallet.network)}`;
            let confirmations = await getEthTxnConfirmations(url, pending_txns[count].txnId);

            if (confirmations >= 15) {
              WalletTransactions.update(
                {
                  _id: pending_txns[count]._id,
                },
                {
                  $set: {
                    status: 'completed',
                  },
                }
              );

              Wallets.update(
                {
                  _id: wallet._id,
                },
                {
                  $set: {
                    confirmedBalance: await Paymeter.getBalance(wallet._id),
                  },
                }
              );
            } else if (helpers.daysDifference(Date.now(), pending_txns[count].createdAt) >= 1) {
              WalletTransactions.update(
                {
                  _id: pending_txns[count]._id,
                },
                {
                  $set: {
                    status: 'cancelled',
                  },
                }
              );

              Wallets.update(
                {
                  _id: wallet._id,
                },
                {
                  $set: {
                    confirmedBalance: await Paymeter.getBalance(wallet._id),
                  },
                }
              );
            }
          }
        } else {
          if (pending_txns[count].status === 'processing') {
            //check if previous nonce is broadcasted
            let prev_nonce_txn = WalletTransactions.findOne({
              fromWallet: wallet._id,
              nonce: pending_txns[count].nonce - 1,
            });

            if (prev_nonce_txn) {
              if (prev_nonce_txn.status === 'pending' || prev_nonce_txn.status === 'completed') {
                let hash = await sendRawTxn(pending_txns[count].rawTx, web3);
                WalletTransactions.update(
                  {
                    _id: pending_txns[count]._id,
                  },
                  {
                    $set: {
                      status: 'pending',
                      txnId: hash,
                    },
                  }
                );

                Wallets.update(
                  {
                    _id: wallet._id,
                  },
                  {
                    $set: {
                      confirmedBalance: await Paymeter.getBalance(wallet._id),
                    },
                  }
                );
              } else if (prev_nonce_txn.status === 'cancelled') {
                WalletTransactions.update(
                  {
                    _id: pending_txns[count]._id,
                  },
                  {
                    $set: {
                      status: 'cancelled',
                    },
                  }
                );

                Wallets.update(
                  {
                    _id: wallet._id,
                  },
                  {
                    $set: {
                      confirmedBalance: await Paymeter.getBalance(wallet._id),
                    },
                  }
                );
              }
            }
          } else {
            let url = `${await Config.getPaymeterConnectionDetails('eth', wallet.network)}`;
            let confirmations = await getEthTxnConfirmations(url, pending_txns[count].txnId);
            if (confirmations >= 15) {
              WalletTransactions.update(
                {
                  _id: pending_txns[count]._id,
                },
                {
                  $set: {
                    status: 'completed',
                  },
                }
              );

              Wallets.update(
                {
                  _id: wallet._id,
                },
                {
                  $set: {
                    confirmedBalance: await Paymeter.getBalance(wallet._id),
                  },
                }
              );
            } else if (helpers.daysDifference(Date.now(), pending_txns[count].createdAt) >= 1) {
              WalletTransactions.update(
                {
                  _id: pending_txns[count]._id,
                },
                {
                  $set: {
                    status: 'cancelled',
                  },
                }
              );

              Wallets.update(
                {
                  _id: wallet._id,
                },
                {
                  $set: {
                    confirmedBalance: await Paymeter.getBalance(wallet._id),
                  },
                }
              );
            }
          }
        }
      }
    }

    ready();
  } catch (e) {
    ready();
  }
}

const processDeposits = async (ready) => {
  try {
    let pending_txns = WalletTransactions.find({
      type: 'deposit',
      status: 'pending',
    }).fetch();

    for (let count = 0; count < pending_txns.length; count++) {
      let wallet_id = pending_txns[count].toWallet;
      let wallet = Wallets.findOne({
        _id: wallet_id,
      });

      if (wallet.coinType === 'ETH' || wallet.coinType === 'ERC20') {
        let url = `${await Config.getPaymeterConnectionDetails('eth', wallet.network)}`;
        let confirmations = await getEthTxnConfirmations(url, pending_txns[count].txnId);
        if (confirmations >= 15) {
          WalletTransactions.update(
            {
              _id: pending_txns[count]._id,
            },
            {
              $set: {
                status: 'completed',
              },
            }
          );

          Wallets.update(
            {
              _id: wallet._id,
            },
            {
              $set: {
                confirmedBalance: await Paymeter.getBalance(wallet._id),
              },
            }
          );

          if (pending_txns[count].usdCharged) {
            let paymeter_userData = Paymeter.find({ userId: wallet.userId });

            if (paymeter_userData) {
              let bill = paymeter_userData.bill || '0';
              bill = new BigNumber(bill).plus(pending_txns[count].usdCharged).toString();

              Paymeter.upsert(
                {
                  userId: wallet.userId,
                },
                {
                  $set: {
                    bill: bill,
                  },
                }
              );
            } else {
              Paymeter.upsert(
                {
                  userId: wallet.userId,
                },
                {
                  $set: {
                    bill: pending_txns[count].usdCharged,
                  },
                }
              );
            }
          }
        } else if (helpers.daysDifference(Date.now(), pending_txns[count].createdAt) >= 1) {
          WalletTransactions.update(
            {
              _id: pending_txns[count]._id,
            },
            {
              $set: {
                status: 'cancelled',
              },
            }
          );

          Wallets.update(
            {
              _id: wallet._id,
            },
            {
              $set: {
                confirmedBalance: await Paymeter.getBalance(wallet._id),
              },
            }
          );
        }
      }
    }

    ready()
  } catch (e) {
    ready()
  }
}

const updateGasPrice = async (ready) => {
  try {
    let testnet_gasPrice = await getGasPrice(`${await Config.getPaymeterConnectionDetails('eth', 'testnet')}`);
    Utilities.upsert(
      {
        key: 'testnet-gasPrice',
      },
      {
        $set: {
          value: testnet_gasPrice.toString(),
        },
      }
    );

    let mainnet_gasPrice = await getGasPrice(`${await Config.getPaymeterConnectionDetails('eth', 'mainnet')}`);

    Utilities.upsert(
      {
        key: 'mainnet-gasPrice',
      },
      {
        $set: {
          value: mainnet_gasPrice.toString(),
        },
      }
    );

    ready()
  } catch (e) {
    ready()
  }
}

const scanEthTestnet = async (ready) => {
  try {
    let testnet_url = await Config.getPaymeterConnectionDetails('eth', 'testnet');
    let provider = new Web3.providers.WebsocketProvider(testnet_url);
    let testnet_web3 = new Web3(provider);

    let last_block = Utilities.findOne({
      key: 'testnet-eth-last-scanned-blockNumber',
    });

    let block = null;

    if (last_block) {
      last_block = last_block.value;
      block = await getBlock(last_block + 1, testnet_web3);
    } else {
      let latest_block_number = await latestBlock(testnet_web3);
      block = await getBlock(latest_block_number, testnet_web3);
    }

    console.log(block.number)

    let promises = [];
    if (block.transactions) {
      async function processTxn(txnHash) {
        return new Promise(async (resolve, reject) => {
          try {
            let txn_details = await getETHTransaction(txnHash, testnet_web3);

            if (txn_details.to) {
              let to_exists_internally = Wallets.findOne({
                coinType: 'ETH',
                network: 'testnet',
                address: txn_details.to.toLowerCase(),
              });

              if (to_exists_internally) {
                WalletTransactions.upsert(
                  {
                    toWallet: to_exists_internally._id,
                    fromAddress: txn_details.from.toLowerCase(),
                    createdAt: block.timestamp * 1000,
                    txnId: txnHash,
                    type: 'deposit',
                  },
                  {
                    $setOnInsert: {
                      amount: testnet_web3.utils.fromWei(txn_details.value, 'ether').toString(),
                      status: 'pending',
                    },
                  }
                );
              }
            }

            resolve();
          } catch (e) {
            reject(e);
          }
        });
      }

      for (let count = 0; count < block.transactions.length; count++) {
        promises.push(processTxn(block.transactions[count]));
      }
    }

    //detect erc20 deposits
    let erc20_contracts_addresses = await getDistinctERC20('testnet');

    async function processContract(contractAddress) {
      return new Promise(async (resolve, reject) => {
        try {
          let logs = await getERC20Events(testnet_web3, contractAddress, block.number);
          for (var iii = 0; iii < logs.length; iii++) {
            let fromAddressOfEvent = logs[iii].returnValues.from.toLowerCase();
            let toAddressOfEvent = logs[iii].returnValues.to.toLowerCase();
            let amountOfEvent = logs[iii].returnValues.value;
            let to_exists_internally = Wallets.findOne({
              coinType: 'ERC20',
              network: 'testnet',
              address: toAddressOfEvent,
              contractAddress: contractAddress,
            });

            if (to_exists_internally) {
              WalletTransactions.upsert(
                {
                  toWallet: to_exists_internally._id,
                  fromAddress: fromAddressOfEvent,
                  createdAt: block.timestamp * 1000,
                  txnId: logs[iii].transactionHash,
                  type: 'deposit',
                },
                {
                  $setOnInsert: {
                    amount: testnet_web3.utils.fromWei(amountOfEvent, 'ether').toString(),
                    status: 'pending',
                  },
                }
              );
            }
          }

          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }

    for (let count = 0; count < erc20_contracts_addresses.length; count++) {
      promises.push(processContract(erc20_contracts_addresses[count]));
    }

    await Promise.all(promises);

    Utilities.upsert(
      {
        key: 'testnet-eth-last-scanned-blockNumber',
      },
      {
        $set: {
          value: block.number,
        },
      }
    );

    ready()
    cron.setTimeout(Meteor.bindEnvironment(scanEthTestnet), 12000, 'scan eth block testnet')
  } catch (e) {
    ready()
    cron.setTimeout(Meteor.bindEnvironment(scanEthTestnet), 12000, 'scan eth block testnet')
  }
}

const scanEthMainnet = async (ready) => {
  try {
    let mainnet_url = await Config.getPaymeterConnectionDetails('eth', 'mainnet');
    let mainnet_web3 = new Web3(new Web3.providers.WebsocketProvider(mainnet_url));

    let last_block = Utilities.findOne({
      key: 'mainnet-eth-last-scanned-blockNumber',
    });

    let block = null;

    if (last_block) {
      last_block = last_block.value;
      block = await getBlock(last_block + 1, mainnet_web3);
    } else {
      let latest_block_number = await latestBlock(mainnet_web3);
      block = await getBlock(latest_block_number, mainnet_web3);
    }

    let promises = [];

    if (block.transactions) {
      async function processTxn(txnHash) {
        return new Promise(async (resolve, reject) => {
          try {
            let txn_details = await getETHTransaction(txnHash, mainnet_web3);

            let from_exists_internally = Wallets.findOne({
              coinType: 'ETH',
              network: 'mainnet',
              address: txn_details.from.toLowerCase(),
            });

            if (from_exists_internally) {
              if (txn_details.to) {
                let to_exists_internally = Wallets.findOne({
                  coinType: 'ETH',
                  network: 'mainnet',
                  address: txn_details.to.toLowerCase(),
                });

                if (to_exists_internally) {
                  WalletTransactions.upsert(
                    {
                      toWallet: to_exists_internally._id,
                      fromAddress: txn_details.from.toLowerCase(),
                      createdAt: block.timestamp * 1000,
                      txnId: txnHash,
                      type: 'deposit',
                    },
                    {
                      $setOnInsert: {
                        amount: mainnet_web3.utils.fromWei(txn_details.value, 'ether').toString(),
                        status: 'pending',
                      },
                    }
                  );
                }
              }
            } else {
              if (txn_details.to) {
                let to_exists_internally = Wallets.findOne({
                  coinType: 'ETH',
                  network: 'mainnet',
                  address: txn_details.to.toLowerCase(),
                });

                if (to_exists_internally) {
                  //came from outside. show deposit and charge user
                  let eth_price = CoinPrices.findOne({
                    symbol: 'ETH',
                  });

                  //if the price in DB was last updated before 15 min then don't use that price.
                  if (eth_price.usd_price && helpers.minutesDifference(Date.now(), block.timestamp * 1000) < 15) {
                    WalletTransactions.upsert(
                      {
                        toWallet: to_exists_internally._id,
                        fromAddress: txn_details.from.toLowerCase(),
                        createdAt: block.timestamp * 1000,
                        txnId: txnHash,
                        type: 'deposit',
                      },
                      {
                        $setOnInsert: {
                          amount: mainnet_web3.utils.fromWei(txn_details.value, 'ether').toString(),
                          usdCharged: new BigNumber(helpers.paymeterDepositFees())
                            .times(new BigNumber(mainnet_web3.utils.fromWei(txn_details.value, 'ether').toString()).times(eth_price.usd_price))
                            .dividedBy(100)
                            .toString(),
                          status: 'pending',
                        },
                      }
                    );
                  } else {
                    //this may happen when coinmarketcap API not working or txn detected before price update on DB (i.e., old price in DB)
                    //in this case we just charge $helpers.paymeterDepositFeesERC20NotFound()
                    //in future get coinmarketcap premium API and find the historical value and calculate fees using it.
                    WalletTransactions.upsert(
                      {
                        toWallet: to_exists_internally._id,
                        fromAddress: txn_details.from.toLowerCase(),
                        createdAt: block.timestamp * 1000,
                        txnId: txnHash,
                        type: 'deposit',
                      },
                      {
                        $setOnInsert: {
                          amount: mainnet_web3.utils.fromWei(txn_details.value, 'ether').toString(),
                          usdCharged: helpers.paymeterDepositFeesERC20NotFound(),
                          status: 'pending',
                        },
                      }
                    );
                  }
                }
              }
            }

            resolve();
          } catch (e) {
            reject(e);
          }
        });
      }

      for (let count = 0; count < block.transactions.length; count++) {
        promises.push(processTxn(block.transactions[count]));
      }
    }

    //detect erc20 deposits
    let erc20_contracts_addresses = await getDistinctERC20('mainnet');

    async function processContract(contractAddress) {
      return new Promise(async (resolve, reject) => {
        try {
          let logs = await getERC20Events(mainnet_web3, contractAddress, block.number);

          for (var iii = 0; iii < logs.length; iii++) {
            let fromAddressOfEvent = logs[iii].returnValues.from.toLowerCase();
            let toAddressOfEvent = logs[iii].returnValues.to.toLowerCase();
            let amountOfEvent = logs[iii].returnValues.value.toString();

            let from_exists_internally = Wallets.findOne({
              coinType: 'ERC20',
              network: 'mainnet',
              address: fromAddressOfEvent,
              contractAddress: contractAddress,
            });

            if (from_exists_internally) {
              let to_exists_internally = Wallets.findOne({
                coinType: 'ERC20',
                network: 'mainnet',
                address: toAddressOfEvent,
                contractAddress: contractAddress,
              });

              if (to_exists_internally) {
                WalletTransactions.upsert(
                  {
                    toWallet: to_exists_internally._id,
                    fromAddress: fromAddressOfEvent.toLowerCase(),
                    createdAt: block.timestamp * 1000,
                    txnId: logs[iii].transactionHash,
                    type: 'deposit',
                  },
                  {
                    $setOnInsert: {
                      amount: mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString(),
                      status: 'pending',
                    },
                  }
                );
              }
            } else {
              let to_exists_internally = Wallets.findOne({
                coinType: 'ERC20',
                network: 'mainnet',
                address: toAddressOfEvent.toLowerCase(),
              });

              if (to_exists_internally) {
                let erc20_info = ERC20.findOne({
                  address: contractAddress,
                });

                if (erc20_info) {
                  if (erc20_info.symbol) {
                    let token_price = CoinPrices.findOne({
                      symbol: erc20_info.symbol,
                    });

                    if (token_price.usd_price) {
                      WalletTransactions.upsert(
                        {
                          toWallet: to_exists_internally._id,
                          fromAddress: fromAddressOfEvent.toLowerCase(),
                          createdAt: block.timestamp * 1000,
                          txnId: logs[iii].transactionHash,
                          type: 'deposit',
                        },
                        {
                          $setOnInsert: {
                            amount: mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString(),
                            usdCharged: new BigNumber(helpers.paymeterDepositFees())
                              .times(new BigNumber(mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString()).times(token_price.usd_price))
                              .dividedBy(100)
                              .toString(),
                            usdPrice: token_price.usd_price,
                            status: 'pending',
                          },
                        }
                      );
                    } else {
                      WalletTransactions.upsert(
                        {
                          toWallet: to_exists_internally._id,
                          fromAddress: fromAddressOfEvent.toLowerCase(),
                          createdAt: block.timestamp * 1000,
                          txnId: logs[iii].transactionHash,
                          type: 'deposit',
                        },
                        {
                          $setOnInsert: {
                            amount: mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString(),
                            usdCharged: helpers.paymeterDepositFeesERC20NotFound(),
                            status: 'pending',
                          },
                        }
                      );
                    }
                  } else {
                    WalletTransactions.upsert(
                      {
                        toWallet: to_exists_internally._id,
                        fromAddress: fromAddressOfEvent.toLowerCase(),
                        createdAt: block.timestamp * 1000,
                        txnId: logs[iii].transactionHash,
                        type: 'deposit',
                      },
                      {
                        $setOnInsert: {
                          amount: mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString(),
                          usdCharged: helpers.paymeterDepositFeesERC20NotFound(),
                          status: 'pending',
                        },
                      }
                    );
                  }
                } else {
                  //make ethploroer call and find token symbol
                  try {
                    let price = await getAndUpdateERC20ContractSymbol(contractAddress, 'mainnet');
                    WalletTransactions.upsert(
                      {
                        toWallet: to_exists_internally._id,
                        fromAddress: fromAddressOfEvent.toLowerCase(),
                        createdAt: block.timestamp * 1000,
                        txnId: logs[iii].transactionHash,
                        type: 'deposit',
                      },
                      {
                        $setOnInsert: {
                          amount: mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString(),
                          usdCharged: new BigNumber(helpers.paymeterDepositFees())
                            .times(new BigNumber(mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString()).times(price))
                            .dividedBy(100)
                            .toString(),
                          usdPrice: price,
                          status: 'pending',
                        },
                      }
                    );
                  } catch (e) {
                    WalletTransactions.upsert(
                      {
                        toWallet: to_exists_internally._id,
                        fromAddress: fromAddressOfEvent.toLowerCase(),
                        createdAt: block.timestamp * 1000,
                        txnId: logs[iii].transactionHash,
                        type: 'deposit',
                      },
                      {
                        $setOnInsert: {
                          amount: mainnet_web3.utils.fromWei(amountOfEvent, 'ether').toString(),
                          usdCharged: helpers.paymeterDepositFeesERC20NotFound(),
                          status: 'pending',
                        },
                      }
                    );
                  }
                }
              }
            }
          }

          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }

    for (let count = 0; count < erc20_contracts_addresses.length; count++) {
      promises.push(processContract(erc20_contracts_addresses[count]));
    }

    Utilities.upsert(
      {
        key: 'mainnet-eth-last-scanned-blockNumber',
      },
      {
        $set: {
          value: block.number,
        },
      }
    );

    await Promise.all(promises);

    ready()
    cron.setTimeout(Meteor.bindEnvironment(scanEthMainnet), 12000, 'scan eth block mainnet')
  } catch (e) {
    ready()
    cron.setTimeout(Meteor.bindEnvironment(scanEthMainnet), 12000, 'scan eth block mainnet')
  }
}

function startCrons() {
  if (!isPaymeterCronInitialized && RemoteConfig && RemoteConfig.features && RemoteConfig.features.Paymeter) {
    console.log('Starting paymeter');

    if (['production'].includes(process.env.NODE_ENV)) {
      cron.setTimeout(Meteor.bindEnvironment(updatePrices), 1000, 'update prices')
    } else {
      cron.setTimeout(Meteor.bindEnvironment(updatePrices), 1000 * 60 * 60 * 12, 'update prices')
    }

    cron.setInterval(Meteor.bindEnvironment(addSymbolToContracts), 1000 * 60 * 60 * 12, 'add symbols to contracts');
    cron.setInterval(Meteor.bindEnvironment(processWithdrawls), 1000 * 12, 'process withdrawls');
    cron.setInterval(Meteor.bindEnvironment(processDeposits), 1000 * 12, 'process deposits');
    cron.setInterval(Meteor.bindEnvironment(updateGasPrice), 1000 * 12, 'update gas price');
    
    cron.setTimeout(Meteor.bindEnvironment(scanEthTestnet), 1000, 'scan eth block testnet')
    cron.setTimeout(Meteor.bindEnvironment(scanEthMainnet), 1000, 'scan eth block mainnet')

    isPaymeterCronInitialized = true;
  }
}

process.on('RemoteConfigChanged', () => {
  startCrons();
});

startCrons();

/*Utilities.upsert({
  key: "testnet-eth-last-scanned-blockNumber"
}, {
  $set: {
    value: 3527701
  }
})*/