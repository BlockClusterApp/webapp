import Config from '../../modules/config/server';
import { Wallets } from '../../collections/wallets/wallets.js';
const Web3 = require('web3');
let Wallet = require('ethereumjs-wallet');
import { WalletTransactions } from '../../collections/walletTransactions/walletTransactions.js';
import { Utilities } from '../../collections/utilities/utilities.js';
import helpers from '../../modules/helpers';
const BigNumber = require('bignumber.js');
const EthereumTx = require('ethereumjs-tx');
import Webhook from '../communication/webhook';
import agenda from '../../modules/schedulers/agenda';

const Cryptr = require('cryptr');

const erc20ABI = [
  { constant: true, inputs: [], name: 'name', outputs: [{ name: '', type: 'string' }], payable: false, stateMutability: 'view', type: 'function' },
  {
    constant: false,
    inputs: [{ name: '_spender', type: 'address' }, { name: '_value', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { constant: true, inputs: [], name: 'totalSupply', outputs: [{ name: '', type: 'uint256' }], payable: false, stateMutability: 'view', type: 'function' },
  {
    constant: false,
    inputs: [{ name: '_from', type: 'address' }, { name: '_to', type: 'address' }, { name: '_value', type: 'uint256' }],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { constant: true, inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], payable: false, stateMutability: 'view', type: 'function' },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  { constant: true, inputs: [], name: 'symbol', outputs: [{ name: '', type: 'string' }], payable: false, stateMutability: 'view', type: 'function' },
  {
    constant: false,
    inputs: [{ name: '_to', type: 'address' }, { name: '_value', type: 'uint256' }],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }, { name: '_spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  { payable: true, stateMutability: 'payable', type: 'fallback' },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: 'owner', type: 'address' }, { indexed: true, name: 'spender', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' }],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: 'from', type: 'address' }, { indexed: true, name: 'to', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' }],
    name: 'Transfer',
    type: 'event',
  },
];

function createWallet(coinType, walletName, userId, network, options) {
  let walletId;
  if (coinType === 'ETH') {
    let wallet = Wallet.generate();
    let private_key_hex = wallet.getPrivateKey().toString('hex');
    let address = wallet.getAddress();

    const cryptr = new Cryptr(options.password);

    walletId = Wallets.insert({
      coinType: 'ETH',
      privateKey: cryptr.encrypt(private_key_hex),
      address: '0x' + address.toString('hex'),
      user: userId,
      walletName: walletName,
      network: network,
      createdAt: Date.now(),
    });
  } else if (coinType === 'ERC20') {
    let wallet = Wallet.generate();
    let private_key_hex = wallet.getPrivateKey().toString('hex');
    let address = wallet.getAddress();

    const cryptr = new Cryptr(options.password);

    walletId = Wallets.insert({
      coinType: 'ERC20',
      privateKey: cryptr.encrypt(private_key_hex),
      address: '0x' + address.toString('hex'),
      user: userId,
      contractAddress: options.contractAddress,
      tokenSymbol: options.tokenSymbol,
      walletName: walletName,
      network: network,
      createdAt: Date.now(),
    });
  } else {
    return false;
  }

  return walletId;
}

async function getBalance(walletId) {
  return new Promise(async (resolve, reject) => {
    let wallet = Wallets.findOne({
      _id: walletId,
    });

    let coinType = wallet.coinType;

    if (wallet) {
      if (coinType === 'ETH') {
        let web3 = new Web3(new Web3.providers.HttpProvider(`${await Config.getPaymeterConnectionDetails('eth', wallet.network)}`));

        web3.eth.getBlockNumber(
          Meteor.bindEnvironment((err, latestBlockNumber) => {
            if (!err) {
              web3.eth.getBalance(
                wallet.address,
                latestBlockNumber - 15,
                Meteor.bindEnvironment((error, minedBalance) => {
                  if (!error) {
                    minedBalance = web3.fromWei(minedBalance, 'ether').toString();

                    let withdraw_txns = WalletTransactions.find({
                      fromWallet: walletId,
                      status: {
                        $in: ['pending', 'processing'],
                      },
                      type: 'withdrawal',
                    }).fetch();

                    for (let count = 0; count < withdraw_txns.length; count++) {
                      minedBalance = new BigNumber(minedBalance).minus(new BigNumber(withdraw_txns[count].amount).plus(withdraw_txns[count].fee)).toString();
                    }

                    resolve(helpers.getFlooredFixed(parseFloat(minedBalance), 5) < 0 ? '0.00000' : helpers.getFlooredFixed(parseFloat(minedBalance), 5));
                  } else {
                    reject('An error occured');
                  }
                })
              );
            } else {
              reject('An error occured');
            }
          })
        );
      } else if (coinType === 'ERC20') {
        let web3 = new Web3(new Web3.providers.HttpProvider(`${await Config.getPaymeterConnectionDetails('eth', wallet.network)}`));

        let erc20 = web3.eth.contract(erc20ABI);
        let erc20_instance = erc20.at(wallet.contractAddress);

        web3.eth.getBlockNumber(
          Meteor.bindEnvironment((err, latestBlockNumber) => {
            if (!err) {
              erc20_instance.balanceOf.call(
                wallet.address,
                latestBlockNumber - 15,
                Meteor.bindEnvironment((error, minedBalance) => {
                  if (!error) {
                    minedBalance = web3.fromWei(minedBalance, 'ether').toString();

                    let withdraw_txns = WalletTransactions.find({
                      fromWallet: walletId,
                      status: {
                        $in: ['pending', 'processing'],
                      },
                      type: 'withdrawal',
                    }).fetch();

                    for (let count = 0; count < withdraw_txns.length; count++) {
                      minedBalance = new BigNumber(minedBalance).minus(new BigNumber(withdraw_txns[count].amount)).toString();
                    }

                    resolve(helpers.getFlooredFixed(parseFloat(minedBalance), 5) < 0 ? '0.00000' : helpers.getFlooredFixed(parseFloat(minedBalance), 5));
                  } else {
                    reject('An error occured');
                  }
                })
              );
            } else {
              reject('An error occured');
            }
          })
        );
      } else {
        reject('Invalid coin type');
      }
    } else {
      reject('Wallet not found');
    }
  });
}

async function getNonce(address, url) {
  let web3 = new Web3(new Web3.providers.HttpProvider(url));

  return new Promise((resolve, reject) => {
    web3.eth.getTransactionCount(address, 'pending', function(error, nonce) {
      if (!error) {
        resolve(nonce);
      } else {
        reject('An error occured');
      }
    });
  });
}

async function transfer(fromWalletId, toAddress, amount, options, userId) {
  if (!userId) {
    throw new Error('Transfer requires user to be logged in');
  }
  return new Promise(async (resolve, reject) => {
    let wallet = Wallets.findOne({
      _id: fromWalletId,
      user: userId,
    });

    let coinType = wallet.coinType;

    if (wallet) {
      if (coinType === 'ETH') {
        let url = await Config.getPaymeterConnectionDetails('eth', wallet.network);
        let web3 = new Web3(new Web3.providers.HttpProvider(url));
        let nonce = await getNonce(wallet.address, url);

        let gasPrice = Utilities.findOne({
          key: wallet.network + '-gasPrice',
        }).value;

        let currenct_balance = await getBalance(fromWalletId);

        if (new BigNumber(amount).lte(currenct_balance)) {
          let amount_bigNumber = new BigNumber(web3.toWei(amount, 'ether'));
          let fee = new BigNumber(gasPrice).multipliedBy(21000);
          let final_amount = amount_bigNumber.minus(fee);
          final_amount = web3.fromWei(final_amount.toString(), 'ether');

          var rawTx = {
            gasPrice: web3.toHex(gasPrice),
            gasLimit: web3.toHex(21000),
            from: wallet.address,
            nonce: web3.toHex(nonce),
            to: toAddress,
            value: web3.toHex(web3.toWei(final_amount, 'ether')),
          };

          const cryptr = new Cryptr(options.password);
          let privateKey_decrypted = cryptr.decrypt(wallet.privateKey);

          let tx = new EthereumTx(rawTx);
          const privateKey = Buffer.from(privateKey_decrypted, 'hex');
          tx.sign(privateKey);
          const serializedTx = tx.serialize();

          web3.eth.sendRawTransaction(
            '0x' + serializedTx.toString('hex'),
            Meteor.bindEnvironment((err, hash) => {
              if (err) {
                if (err.toString().includes('insufficient funds')) {
                  reject('Insufficient Funds');
                } else {
                  reject('Unknown Error');
                }
              } else {
                const return_id = WalletTransactions.insert({
                  fromWallet: wallet._id,
                  toAddress: toAddress,
                  amount: final_amount,
                  createdAt: Date.now(),
                  status: 'pending',
                  txnId: hash,
                  type: 'withdrawal',
                  fee: web3.fromWei(fee.toString(), 'ether'),
                });

                resolve(return_id);
              }
            })
          );
        } else {
          reject('Insufficient Balance');
        }
      } else if (coinType === 'ERC20') {
        let url = await Config.getPaymeterConnectionDetails('eth', wallet.network);
        let web3 = new Web3(new Web3.providers.HttpProvider(url));
        if (options.feeWallet) {
          //transfer fee first then actual tokens. actual token transfer will be done by the cron job
          let feeWallet = Wallets.findOne({
            _id: options.feeWallet,
            user: userId,
          });

          let nonce = await getNonce(feeWallet.address, url);
          let gasPrice = Utilities.findOne({
            key: wallet.network + '-gasPrice',
          }).value;

          let currenct_balance = await getBalance(fromWalletId);
          let fee_wallet_current_balance = await getBalance(options.feeWallet);
          if (new BigNumber(amount).lte(currenct_balance)) {
            let fee = new BigNumber(gasPrice).multipliedBy(21000);

            let erc20 = web3.eth.contract(erc20ABI);
            let erc20_instance = erc20.at(wallet.contractAddress);

            let data = erc20_instance.transfer.getData(toAddress, web3.toWei(amount, 'ether'));

            web3.eth.estimateGas(
              {
                to: wallet.contractAddress,
                data: data,
                from: wallet.address,
              },
              Meteor.bindEnvironment(async (error, contractGasLimit) => {
                if (!error) {
                  let rawTx = {
                    gasPrice: web3.toHex(gasPrice),
                    gasLimit: web3.toHex(21000),
                    from: feeWallet.address,
                    nonce: web3.toHex(nonce),
                    to: wallet.address,
                    value: web3.toHex(new BigNumber(gasPrice).multipliedBy(contractGasLimit.toString()).toString()),
                  };

                  let cryptr = new Cryptr(options.feeWalletPassword);
                  let privateKey_decrypted = cryptr.decrypt(feeWallet.privateKey);

                  let tx = new EthereumTx(rawTx);
                  let privateKey = Buffer.from(privateKey_decrypted, 'hex');
                  tx.sign(privateKey);
                  let serializedTx = tx.serialize();

                  web3.eth.sendRawTransaction(
                    '0x' + serializedTx.toString('hex'),
                    Meteor.bindEnvironment(async (err, hash) => {
                      if (!error) {
                        WalletTransactions.insert({
                          fromWallet: feeWallet._id,
                          toAddress: wallet.address,
                          amount: web3.fromWei(new BigNumber(gasPrice).multipliedBy(contractGasLimit.toString()).toString(), 'ether'),
                          createdAt: Date.now(),
                          status: 'pending',
                          txnId: hash,
                          type: 'withdrawal',
                          fee: web3.fromWei(fee.toString(), 'ether'),
                        });

                        let total_fee = new BigNumber(gasPrice).multipliedBy(contractGasLimit.toString()).toString();
                        total_fee = new BigNumber(total_fee).plus(fee.toString()).toString();

                        let processing_txns = WalletTransactions.find({
                          fromWallet: wallet._id,
                          status: 'processing',
                        }).count();

                        nonce = await getNonce(wallet.address, url);

                        if (processing_txns > 0) {
                          nonce = nonce + processing_txns;
                        }

                        let rawTx = {
                          gasPrice: web3.toHex(gasPrice),
                          gasLimit: web3.toHex(contractGasLimit.toString()),
                          from: wallet.address,
                          nonce: web3.toHex(nonce),
                          to: wallet.contractAddress,
                          data: data,
                          value: web3.toHex(web3.toWei('0', 'ether')),
                        };

                        cryptr = new Cryptr(options.password);
                        privateKey_decrypted = cryptr.decrypt(wallet.privateKey);

                        let tx = new EthereumTx(rawTx);
                        const privateKey = Buffer.from(privateKey_decrypted, 'hex');
                        tx.sign(privateKey);
                        const serializedTx = tx.serialize();

                        const return_id = WalletTransactions.insert({
                          fromWallet: wallet._id,
                          toAddress: toAddress,
                          amount: amount,
                          createdAt: Date.now(),
                          status: 'processing',
                          txnId: null,
                          type: 'withdrawal',
                          fee: web3.fromWei(total_fee, 'ether'),
                          nonce: nonce,
                          rawTx: '0x' + serializedTx.toString('hex'),
                          feeDepositWallet: options.feeWallet,
                          feeDepositTxnId: hash,
                        });

                        resolve(return_id);
                      } else {
                        if (err.toString().includes('insufficient funds')) {
                          console.log('First time');
                          reject('Insufficient Ether for Fees');
                        } else {
                          reject('Unknown Error');
                        }
                      }
                    })
                  );
                } else {
                  reject('An error occured');
                }
              })
            );
          } else {
            reject('Insufficient Tokens');
          }
        } else {
          let nonce = await getNonce(wallet.address, url);

          let gasPrice = Utilities.findOne({
            key: wallet.network + '-gasPrice',
          }).value;

          let currenct_balance = await getBalance(fromWalletId);

          if (new BigNumber(amount).lte(currenct_balance)) {
            let erc20 = web3.eth.contract(erc20ABI);
            let erc20_instance = erc20.at(wallet.contractAddress);

            let data = erc20_instance.transfer.getData(toAddress, web3.toWei(amount, 'ether'));

            web3.eth.estimateGas(
              {
                to: wallet.contractAddress,
                data: data,
                from: wallet.address,
              },
              Meteor.bindEnvironment((error, gasLimit) => {
                if (!error) {
                  let processing_txns = WalletTransactions.find({
                    fromWallet: fromWalletId,
                    status: 'processing',
                  }).count();

                  if (processing_txns > 0) {
                    nonce = nonce + processing_txns;
                    var rawTx = {
                      gasPrice: web3.toHex(gasPrice),
                      gasLimit: web3.toHex(gasLimit),
                      from: wallet.address,
                      nonce: web3.toHex(nonce),
                      to: wallet.contractAddress,
                      data: data,
                      value: web3.toHex(web3.toWei('0', 'ether')),
                    };

                    const cryptr = new Cryptr(options.password);
                    let privateKey_decrypted = cryptr.decrypt(wallet.privateKey);

                    let tx = new EthereumTx(rawTx);
                    const privateKey = Buffer.from(privateKey_decrypted, 'hex');
                    tx.sign(privateKey);
                    const serializedTx = tx.serialize();

                    const return_id = WalletTransactions.insert({
                      fromWallet: wallet._id,
                      toAddress: toAddress,
                      amount: amount,
                      createdAt: Date.now(),
                      status: 'processing',
                      txnId: null,
                      type: 'withdrawal',
                      fee: web3.fromWei(new BigNumber(gasPrice).multipliedBy(gasLimit).toString(), 'ether'),
                      nonce: nonce,
                      rawTx: '0x' + serializedTx.toString('hex'),
                      feeDepositWallet: null,
                      feeDepositStatus: null,
                      feeDepositTxnId: null,
                      feeDepositGasPrice: null, //both txns should go with same gas price
                    });

                    resolve(return_id);
                  } else {
                    var rawTx = {
                      gasPrice: web3.toHex(gasPrice),
                      gasLimit: web3.toHex(gasLimit),
                      from: wallet.address,
                      nonce: web3.toHex(nonce),
                      to: wallet.contractAddress,
                      data: data,
                      value: web3.toHex(web3.toWei('0', 'ether')),
                    };

                    const cryptr = new Cryptr(options.password);
                    let privateKey_decrypted = cryptr.decrypt(wallet.privateKey);

                    let tx = new EthereumTx(rawTx);
                    const privateKey = Buffer.from(privateKey_decrypted, 'hex');
                    tx.sign(privateKey);
                    const serializedTx = tx.serialize();

                    web3.eth.sendRawTransaction(
                      '0x' + serializedTx.toString('hex'),
                      Meteor.bindEnvironment((err, hash) => {
                        if (err) {
                          if (err.toString().includes('insufficient funds')) {
                            reject('Insufficient Ether for Fees');
                          } else {
                            reject('Unknown Error');
                          }
                        } else {
                          const return_id = WalletTransactions.insert({
                            fromWallet: wallet._id,
                            toAddress: toAddress,
                            amount: amount,
                            createdAt: Date.now(),
                            status: 'pending',
                            txnId: hash,
                            type: 'withdrawal',
                            fee: web3.fromWei(new BigNumber(gasPrice).multipliedBy(gasLimit).toString(), 'ether'),
                            feeDepositWallet: null,
                            feeDepositStatus: null,
                            feeDepositTxnId: null,
                            feeDepositGasPrice: null, //both txns should go with same gas price
                          });

                          resolve(return_id);
                        }
                      })
                    );
                  }
                } else {
                  reject('An error occured');
                }
              })
            );
          } else {
            reject('Insufficient Tokens');
          }
        }
      }
    } else {
      reject('Wallet not found');
    }
  });
}

async function getWalletTransactions(walletId, userId) {
  userId = userId || Meteor.userId();
  const wallet = Wallets.find({
    _id: walletId,
    userId,
  });

  if (!wallet) {
    return Promise.reject(new Error('Invalid wallet id'));
  }

  return WalletTransactions.find({
    fromWallet: wallet._id,
  }).fetch();
}

Meteor.methods({
  createWallet: (coinType, walletName, network, options) => {
    if (Meteor.userId()) {
      return createWallet(coinType, walletName, Meteor.userId(), network, options);
    } else {
      throw new Meteor.Error('Not Allowed', 'Please login');
    }
  },
  transferWallet: async (fromWalletId, toAddress, amount, options) => {
    if (Meteor.userId()) {
      try {
        let txnHash = await transfer(fromWalletId, toAddress, amount, options || {}, Meteor.userId());
        return txnHash;
      } catch (e) {
        throw new Meteor.Error(e, e);
      }
    } else {
      throw new Meteor.Error('Not Allowed', 'Please login');
    }
  },
});

module.exports = {
  createWallet,
  getBalance,
  getBalanceCallback: async (_id, func) => {
    try {
      let balance = await getBalance(_id);
      func(null, balance);
    } catch (e) {
      func('An error occured');
    }
  },
  transfer,
  getNonce,
  erc20ABI,
  getWalletTransactions,
};
