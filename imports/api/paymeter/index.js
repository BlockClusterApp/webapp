import Config from '../../modules/config/server';
import { Wallets } from '../../collections/wallets/wallets.js';
const Web3 = require('web3');
let Wallet = require('ethereumjs-wallet');
import { WalletTransactions } from '../../collections/walletTransactions/walletTransactions.js';
import { Utilities } from '../../collections/utilities/utilities.js';
import helpers from '../../modules/helpers';
const BigNumber = require('bignumber.js');
const EthereumTx = require('ethereumjs-tx');
import PaymeterPricing from '../../collections/pricing/paymeter';
import PaymeterBillHistory from '../../collections/paymeter/paymeter-bill-history';
import Webhook from '../communication/webhook';
import agenda from '../../modules/schedulers/agenda';
import { Paymeter as PaymeterCollection } from '../../collections/paymeter/paymeter.js';
import Billing from '../../api/billing';
import moment from 'moment';
import Voucher from '../network/voucher';
const Cryptr = require('cryptr');
const secp256k1 = require('secp256k1');

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
  return new Promise((resolve, reject) => {
    if (!isUserSubscribedToPaymeter(userId)) {
      reject('Please subscribe');
    } else {
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
          confirmedBalance: '0',
        });

        resolve(walletId);
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
          confirmedBalance: '0',
        });

        resolve(walletId);
      } else {
        reject('Invalid coin type');
      }
    }
  });
}

//this gives balance by omitting internal deposits
async function getEthDetectedBalance(walletId) {
  return new Promise(async (resolve, reject) => {
    let wallet = Wallets.findOne({
      _id: walletId,
    });

    let coinType = wallet.coinType;

    if (wallet) {
      if (coinType === 'ETH') {
        let web3 = new Web3(new Web3.providers.WebsocketProvider(`${await Config.getPaymeterConnectionDetails('eth', wallet.network)}`));

        web3.eth.getBlockNumber(
          Meteor.bindEnvironment((err, latestBlockNumber) => {
            if (!err) {
              web3.eth.getBalance(
                wallet.address,
                'pending',
                Meteor.bindEnvironment((error, minedBalance) => {
                  if (!error) {
                    minedBalance = web3.utils.fromWei(minedBalance, 'ether').toString();
                    resolve(new BigNumber(minedBalance).toFixed(18).toString());
                  } else {
                    reject(error.toString());
                  }
                })
              );
            } else {
              reject(err.toString());
            }
          })
        );
      }
    }
  });
}

async function getBalance(walletId) {
  return new Promise(async (resolve, reject) => {
    let wallet = Wallets.findOne({
      _id: walletId,
    });

    let coinType = wallet.coinType;

    if (wallet) {
      if (coinType === 'ETH') {
        let web3 = new Web3(new Web3.providers.WebsocketProvider(`${await Config.getPaymeterConnectionDetails('eth', wallet.network)}`));

        web3.eth.getBlockNumber(
          Meteor.bindEnvironment((err, latestBlockNumber) => {
            if (!err) {
              web3.eth.getBalance(
                wallet.address,
                latestBlockNumber - 15,
                Meteor.bindEnvironment((error, minedBalance) => {
                  if (!error) {
                    minedBalance = web3.utils.fromWei(minedBalance, 'ether').toString();

                    let withdraw_txns = WalletTransactions.find({
                      fromWallet: walletId,
                      internalStatus: {
                        $in: ['pending', 'processing'],
                      },
                      type: 'withdrawal',
                    }).fetch();

                    for (let count = 0; count < withdraw_txns.length; count++) {
                      minedBalance = new BigNumber(minedBalance).minus(new BigNumber(withdraw_txns[count].amount).plus(withdraw_txns[count].fee)).toString();
                    }

                    let deposit_txns = WalletTransactions.find({
                      toWallet: walletId,
                      internalStatus: {
                        $in: ['pending'],
                      },
                      isInternalTxn: true,
                      type: 'deposit',
                    }).fetch();

                    for (let count = 0; count < deposit_txns.length; count++) {
                      minedBalance = new BigNumber(minedBalance).plus(new BigNumber(deposit_txns[count].amount)).toString();
                    }

                    resolve(new BigNumber(minedBalance).toFixed(18).toString());
                  } else {
                    reject(error.toString());
                  }
                })
              );
            } else {
              reject(err.toString());
            }
          })
        );
      } else if (coinType === 'ERC20') {
        let web3 = new Web3(new Web3.providers.WebsocketProvider(`${await Config.getPaymeterConnectionDetails('eth', wallet.network)}`));

        let erc20_instance = new web3.eth.Contract(erc20ABI, wallet.contractAddress);

        web3.eth.getBlockNumber(
          Meteor.bindEnvironment((err, latestBlockNumber) => {
            if (!err) {
              erc20_instance.methods.balanceOf(wallet.address).call(
                {},
                latestBlockNumber - 15,
                Meteor.bindEnvironment((error, minedBalance) => {
                  if (!error) {
                    minedBalance = web3.utils.fromWei(minedBalance, 'ether').toString();

                    let withdraw_txns = WalletTransactions.find({
                      fromWallet: walletId,
                      internalStatus: {
                        $in: ['pending', 'processing'],
                      },
                      type: 'withdrawal',
                    }).fetch();

                    for (let count = 0; count < withdraw_txns.length; count++) {
                      minedBalance = new BigNumber(minedBalance).minus(new BigNumber(withdraw_txns[count].amount)).toString();
                    }

                    let deposit_txns = WalletTransactions.find({
                      toWallet: walletId,
                      internalStatus: {
                        $in: ['pending'],
                      },
                      isInternalTxn: true,
                      type: 'deposit',
                    }).fetch();

                    for (let count = 0; count < deposit_txns.length; count++) {
                      minedBalance = new BigNumber(minedBalance).plus(new BigNumber(deposit_txns[count].amount)).toString();
                    }

                    resolve(new BigNumber(minedBalance).toFixed(18).toString());
                  } else {
                    reject(error.toString());
                  }
                })
              );
            } else {
              reject(err.toString());
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
  let web3 = new Web3(new Web3.providers.WebsocketProvider(url));

  return new Promise((resolve, reject) => {
    web3.eth.getTransactionCount(address, 'pending', function(error, nonce) {
      if (!error) {
        resolve(nonce);
      } else {
        reject(error.toString());
      }
    });
  });
}

async function transfer(fromWalletId, toAddress, amount, options, userId) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId) {
        reject('Transfer requires user to be logged in');
        return;
      }

      if (!isUserSubscribedToPaymeter(userId)) {
        reject('You need to subscribe');
        return;
      }

      let wallet = Wallets.findOne({
        _id: fromWalletId,
        user: userId,
      });

      let sendExactAmount = options.sendExactAmount;

      if (wallet) {
        let coinType = wallet.coinType;
        if (coinType === 'ETH') {
          let url = await Config.getPaymeterConnectionDetails('eth', wallet.network);
          let web3 = new Web3(new Web3.providers.WebsocketProvider(url));
          let nonce = await getNonce(wallet.address, url);

          let gasPrice = Utilities.findOne({
            key: wallet.network + '-gasPrice',
          }).value;

          let currenct_balance = await getBalance(fromWalletId);
          let detected_balance = await getEthDetectedBalance(fromWalletId);

          let gasLimit = 21000;

          if (options.data) {
            let txnObj = {
              to: toAddress,
              data: options.data,
              from: wallet.address,
            };

            if (amount) {
              txnObj.value = web3.utils.toHex(web3.utils.toWei(amount, 'ether'));
            }

            gasLimit = await web3.eth.estimateGas(txnObj);
          }

          if (sendExactAmount) {
            let extra = web3.utils.fromWei(new BigNumber(gasPrice).multipliedBy(gasLimit).toString(), 'ether').toString();
            amount = new BigNumber(extra).plus(amount).toString();
          }

          if (new BigNumber(amount).lte(currenct_balance)) {
            let amount_bigNumber = new BigNumber(web3.utils.toWei(amount, 'ether'));
            let fee = new BigNumber(gasPrice).multipliedBy(gasLimit);
            let final_amount = amount_bigNumber.minus(fee);
            final_amount = web3.utils.fromWei(final_amount.toString(), 'ether');

            var rawTx = {
              gasPrice: web3.utils.toHex(gasPrice),
              gasLimit: web3.utils.toHex(gasLimit),
              from: wallet.address,
              nonce: web3.utils.toHex(nonce),
              to: toAddress,
              value: web3.utils.toHex(web3.utils.toWei(final_amount, 'ether')),
            };

            if (options.data) {
              rawTx.data = options.data;
            }

            if (!final_amount.toString()) {
              delete rawTx.value;
            }

            const cryptr = new Cryptr(options.password);
            let privateKey_decrypted = cryptr.decrypt(wallet.privateKey);

            if (secp256k1.privateKeyVerify(Buffer.from(privateKey_decrypted, 'hex'))) {
              let tx = new EthereumTx(rawTx);
              const privateKey = Buffer.from(privateKey_decrypted, 'hex');
              tx.sign(privateKey);
              const serializedTx = tx.serialize();

              let sendTxnNow = false;

              if (new BigNumber(amount).lte(detected_balance)) {
                sendTxnNow = true;

                if (WalletTransactions.find({ fromWallet: wallet._id, internalStatus: 'processing' }).count() > 0) {
                  sendTxnNow = false;
                }
              }

              let hash = null;

              if (sendTxnNow) {
                hash = (await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))).transactionHash;
              } else {
                hash = web3.utils.sha3('0x' + serializedTx.toString('hex'), { encoding: 'hex' });
              }

              let isInternalTxn = false;
              let internalWallet = Wallets.findOne({
                address: toAddress,
                coinType: {
                  $in: ['ETH', 'ERC20'],
                },
              });

              if (internalWallet) {
                isInternalTxn = true;
              }

              const return_id = WalletTransactions.insert({
                fromWallet: wallet._id,
                toAddress: toAddress,
                amount: final_amount,
                data: options.data || '0x',
                createdAt: Date.now(),
                internalStatus: sendTxnNow ? 'pending' : 'processing',
                status: isInternalTxn ? 'completed' : 'pending',
                isInternalTxn,
                txnId: hash,
                type: 'withdrawal',
                fee: web3.utils.fromWei(fee.toString(), 'ether'),
                rawTx: '0x' + serializedTx.toString('hex'),
                nonce: nonce,
                lastBroadcastedDate: sendTxnNow ? Date.now() : undefined,
              });

              const newConfirmedBalance = await getBalance(wallet._id);

              Wallets.update(
                {
                  _id: wallet._id,
                },
                {
                  $set: {
                    confirmedBalance: newConfirmedBalance,
                  },
                }
              );

              if (internalWallet) {
                WalletTransactions.upsert(
                  {
                    toWallet: internalWallet._id,
                    fromAddress: wallet.address,
                    txnId: hash,
                    type: 'deposit',
                  },
                  {
                    $set: {
                      createdAt: Date.now(),
                      amount: final_amount,
                      internalStatus: 'pending',
                      status: 'completed',
                      isInternalTxn: true,
                    },
                  }
                );

                const toWalletNewConfirmedBalance = await getBalance(internalWallet._id);

                Wallets.update(
                  {
                    _id: internalWallet._id,
                  },
                  {
                    $set: {
                      confirmedBalance: toWalletNewConfirmedBalance,
                    },
                  }
                );
              }

              resolve(return_id);
            } else {
              reject('Password invalid');
            }
          } else {
            reject('Insufficient Balance');
          }
        } else if (coinType === 'ERC20') {
          let url = await Config.getPaymeterConnectionDetails('eth', wallet.network);
          let web3 = new Web3(new Web3.providers.WebsocketProvider(url));
          if (options.feeWalletId) {
            //transfer fee first then actual tokens. actual token transfer will be done by the cron job
            let feeWallet = Wallets.findOne({
              _id: options.feeWalletId,
              user: userId,
            });

            if (!feeWallet) {
              reject('Invalid fee wallet');
              return;
            }

            let nonce = await getNonce(feeWallet.address, url);
            let gasPrice = Utilities.findOne({
              key: wallet.network + '-gasPrice',
            }).value;

            let currenct_balance = await getBalance(fromWalletId);

            if (new BigNumber(amount).lte(currenct_balance)) {
              let feeCollectWallet = null;

              if (options.feeCollectWalletId) {
                //we need to collect fee in tokens
                feeCollectWallet = Wallets.findOne({
                  _id: options.feeCollectWalletId,
                  coinType: 'ERC20',
                  tokenSymbol: wallet.tokenSymbol,
                });

                if (!feeCollectWallet) {
                  reject('Invalid fee collect wallet');
                  return;
                }

                if (!options.tokenValueInEth) {
                  reject('Please provide price of token');
                  return;
                }
              }

              let fee = new BigNumber(gasPrice).multipliedBy(21000);
              let erc20_instance = new web3.eth.Contract(erc20ABI, wallet.contractAddress);
              let data = erc20_instance.methods.transfer(toAddress, web3.utils.toWei(String(amount), 'ether')).encodeABI();

              let contractGasLimit = await web3.eth.estimateGas({
                to: wallet.contractAddress,
                data: data,
                from: wallet.address,
              });

              let amountOfTokenToDeduct = '0';
              if (feeCollectWallet) {
                options.originalTokenValueInEth = options.tokenValueInEth;
                options.tokenValueInEth = new BigNumber(1).dividedBy(options.tokenValueInEth); //1 ETH = ? TOKEN
                amountOfTokenToDeduct = web3.utils.fromWei(
                  new BigNumber(21000)
                    .multipliedBy(gasPrice)
                    .plus(new BigNumber(gasPrice).multipliedBy(contractGasLimit).multipliedBy(2))
                    .toString(),
                  'ether'
                );
                amountOfTokenToDeduct = new BigNumber(amountOfTokenToDeduct).multipliedBy(options.tokenValueInEth).toString();

                if (new BigNumber(new BigNumber(amount).minus(amountOfTokenToDeduct).toFixed(18)).lte(0)) {
                  reject('Transfer amount is too less to cover fees');
                  return;
                }

                if (sendExactAmount) {
                  amount = new BigNumber(amount)
                    .plus(amountOfTokenToDeduct)
                    .toFixed(18)
                    .toString();

                  if (new BigNumber(amount).gt(currenct_balance)) {
                    reject('Insufficient wallet balance');
                    return;
                  }
                }

                amount = new BigNumber(amount)
                  .minus(amountOfTokenToDeduct)
                  .toFixed(18)
                  .toString();

                data = erc20_instance.methods.transfer(toAddress, web3.utils.toWei(String(amount), 'ether')).encodeABI();
              }

              let firstTxnGasLimit = await web3.eth.estimateGas({
                to: wallet.contractAddress,
                data: erc20_instance.methods.transfer(toAddress, web3.utils.toWei(String(amount), 'ether')).encodeABI(),
                from: wallet.address,
              });

              contractGasLimit = firstTxnGasLimit;

              let secondTxnGasLimit = null;

              if (feeCollectWallet) {
                secondTxnGasLimit = await web3.eth.estimateGas({
                  to: wallet.contractAddress,
                  data: erc20_instance.methods
                    .transfer(feeCollectWallet.address, web3.utils.toWei(String(new BigNumber(amountOfTokenToDeduct).toFixed(18).toString()), 'ether'))
                    .encodeABI(),
                  from: wallet.address,
                });

                contractGasLimit = contractGasLimit + secondTxnGasLimit;
              }

              let valueToTransfer = web3.utils.toHex(new BigNumber(gasPrice).multipliedBy(contractGasLimit.toString()).toString());

              let rawTx = {
                gasPrice: web3.utils.toHex(gasPrice),
                gasLimit: web3.utils.toHex(21000),
                from: feeWallet.address,
                nonce: web3.utils.toHex(nonce),
                to: wallet.address,
                value: valueToTransfer,
              };

              let fee_wallet_current_balance = await getBalance(options.feeWalletId);
              let fee_wallet_detected_balance = await getEthDetectedBalance(options.feeWalletId);

              if (
                new BigNumber(web3.utils.fromWei(new BigNumber(gasPrice).multipliedBy(contractGasLimit.toString()).toString(), 'ether'))
                  .plus(web3.utils.fromWei(new BigNumber(21000).multipliedBy(gasPrice).toString(), 'ether'))
                  .lte(fee_wallet_current_balance)
              ) {
                let cryptr = new Cryptr(options.feeWalletPassword);
                let privateKey_decrypted = cryptr.decrypt(feeWallet.privateKey);

                if (secp256k1.privateKeyVerify(Buffer.from(privateKey_decrypted, 'hex'))) {
                  let tx = new EthereumTx(rawTx);
                  let privateKey = Buffer.from(privateKey_decrypted, 'hex');
                  tx.sign(privateKey);
                  let serializedTx = tx.serialize();

                  let sendTxnNow = false;

                  if (
                    new BigNumber(web3.utils.fromWei(new BigNumber(gasPrice).multipliedBy(contractGasLimit.toString()).toString(), 'ether'))
                      .plus(web3.utils.fromWei(new BigNumber(21000).multipliedBy(gasPrice).toString(), 'ether'))
                      .lte(fee_wallet_detected_balance)
                  ) {
                    sendTxnNow = true;

                    if (WalletTransactions.find({ fromWallet: feeWallet._id, internalStatus: 'processing' }).count() > 0) {
                      sendTxnNow = false;
                    }
                  }

                  let hash = null;

                  if (sendTxnNow) {
                    hash = (await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))).transactionHash;
                  } else {
                    hash = web3.utils.sha3('0x' + serializedTx.toString('hex'), { encoding: 'hex' });
                  }

                  WalletTransactions.insert({
                    fromWallet: feeWallet._id,
                    toAddress: wallet.address,
                    amount: web3.utils.fromWei(new BigNumber(gasPrice).multipliedBy(contractGasLimit.toString()).toString(), 'ether'),
                    createdAt: Date.now(),
                    internalStatus: sendTxnNow ? 'pending' : 'processing',
                    status: 'completed',
                    isInternalTxn: true,
                    txnId: hash,
                    type: 'withdrawal',
                    fee: web3.utils.fromWei(fee.toString(), 'ether'),
                    nonce: nonce,
                    lastBroadcastedDate: sendTxnNow ? Date.now() : null,
                    rawTx: '0x' + serializedTx.toString('hex'),
                  });

                  Wallets.update(
                    {
                      _id: feeWallet._id,
                    },
                    {
                      $set: {
                        confirmedBalance: await getBalance(feeWallet._id),
                      },
                    }
                  );

                  let total_fee = new BigNumber(gasPrice).multipliedBy(firstTxnGasLimit.toString()).toString();

                  let processing_txns = WalletTransactions.find({
                    fromWallet: wallet._id,
                    internalStatus: 'processing',
                  }).count();

                  nonce = await getNonce(wallet.address, url);

                  if (processing_txns > 0) {
                    nonce = nonce + processing_txns;
                  }

                  rawTx = {
                    gasPrice: web3.utils.toHex(gasPrice),
                    gasLimit: web3.utils.toHex(firstTxnGasLimit.toString()),
                    from: wallet.address,
                    nonce: web3.utils.toHex(nonce),
                    to: wallet.contractAddress,
                    data: data,
                    value: web3.utils.toHex(web3.utils.toWei('0', 'ether')),
                  };

                  cryptr = new Cryptr(options.password);
                  privateKey_decrypted = cryptr.decrypt(wallet.privateKey);

                  if (secp256k1.privateKeyVerify(Buffer.from(privateKey_decrypted, 'hex'))) {
                    let tx = new EthereumTx(rawTx);
                    const privateKey = Buffer.from(privateKey_decrypted, 'hex');
                    tx.sign(privateKey);
                    let serializedTx = tx.serialize();

                    let isInternalTxn = false;
                    let internalWallet = Wallets.findOne({
                      address: toAddress,
                      coinType: 'ERC20',
                      tokenSymbol: wallet.tokenSymbol,
                    });

                    if (internalWallet) {
                      isInternalTxn = true;
                    }

                    let obj = {
                      fromWallet: wallet._id,
                      toAddress: toAddress,
                      amount: amount,
                      createdAt: Date.now(),
                      internalStatus: 'processing',
                      status: isInternalTxn ? 'completed' : 'pending',
                      isInternalTxn,
                      txnId: web3.utils.sha3('0x' + serializedTx.toString('hex'), { encoding: 'hex' }),
                      type: 'withdrawal',
                      fee: web3.utils.fromWei(total_fee, 'ether'),
                      nonce: nonce,
                      rawTx: '0x' + serializedTx.toString('hex'),
                      feeDepositWallet: options.feeWalletId,
                      feeDepositTxnId: hash,
                    };

                    if (options.originalTokenValueInEth) {
                      obj.feeCollectPriceConversion = options.originalTokenValueInEth;
                    }

                    const return_id = WalletTransactions.insert(obj);

                    if (internalWallet) {
                      WalletTransactions.upsert(
                        {
                          toWallet: internalWallet._id,
                          fromAddress: wallet.address,
                          txnId: web3.utils.sha3('0x' + serializedTx.toString('hex'), { encoding: 'hex' }),
                          type: 'deposit',
                        },
                        {
                          $set: {
                            createdAt: Date.now(),
                            amount: amount,
                            internalStatus: 'pending',
                            status: 'completed',
                            isInternalTxn: true,
                          },
                        }
                      );

                      Wallets.update(
                        {
                          _id: internalWallet._id,
                        },
                        {
                          $set: {
                            confirmedBalance: await getBalance(internalWallet._id),
                          },
                        }
                      );
                    }

                    if (feeCollectWallet) {
                      data = erc20_instance.methods
                        .transfer(feeCollectWallet.address, web3.utils.toWei(String(new BigNumber(amountOfTokenToDeduct).toFixed(18).toString()), 'ether'))
                        .encodeABI();
                      rawTx = {
                        gasPrice: web3.utils.toHex(gasPrice),
                        gasLimit: web3.utils.toHex(secondTxnGasLimit.toString()),
                        from: wallet.address,
                        nonce: web3.utils.toHex(nonce + 1),
                        to: wallet.contractAddress,
                        data: data,
                        value: web3.utils.toHex(web3.utils.toWei('0', 'ether')),
                      };
                      tx = new EthereumTx(rawTx);
                      tx.sign(privateKey);
                      serializedTx = tx.serialize();

                      total_fee = new BigNumber(gasPrice).multipliedBy(secondTxnGasLimit.toString()).toString();
                      obj = {
                        fromWallet: wallet._id,
                        toAddress: feeCollectWallet.address,
                        amount: amountOfTokenToDeduct,
                        createdAt: Date.now(),
                        internalStatus: 'processing',
                        status: 'completed',
                        isInternalTxn: true,
                        txnId: web3.utils.sha3('0x' + serializedTx.toString('hex'), { encoding: 'hex' }),
                        type: 'withdrawal',
                        fee: web3.utils.fromWei(total_fee, 'ether'),
                        nonce: nonce + 1,
                        rawTx: '0x' + serializedTx.toString('hex'),
                        feeDepositWallet: options.feeWalletId,
                        feeDepositTxnId: hash,
                        feeCollectPriceConversion: options.originalTokenValueInEth,
                      };

                      if (options.originalTokenValueInEth) {
                        obj.feeCollectPriceConversion = options.originalTokenValueInEth;
                      }

                      WalletTransactions.insert(obj);

                      if (internalWallet) {
                        WalletTransactions.upsert(
                          {
                            toWallet: feeCollectWallet._id,
                            fromAddress: wallet.address,
                            txnId: web3.utils.sha3('0x' + serializedTx.toString('hex'), { encoding: 'hex' }),
                            type: 'deposit',
                          },
                          {
                            $set: {
                              createdAt: Date.now(),
                              amount: amountOfTokenToDeduct,
                              internalStatus: 'pending',
                              status: 'completed',
                              isInternalTxn: true,
                            },
                          }
                        );

                        Wallets.update(
                          {
                            _id: feeCollectWallet._id,
                          },
                          {
                            $set: {
                              confirmedBalance: await getBalance(feeCollectWallet._id),
                            },
                          }
                        );
                      }
                    }

                    Wallets.update(
                      {
                        _id: wallet._id,
                      },
                      {
                        $set: {
                          confirmedBalance: await getBalance(wallet._id),
                        },
                      }
                    );

                    resolve(return_id);
                  } else {
                    reject('Password invalid');
                  }
                } else {
                  reject('Fee wallet Password invalid');
                }
              } else {
                reject('Insufficient Ether for Fees');
              }
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
              let erc20_instance = new web3.eth.Contract(erc20ABI, wallet.contractAddress);

              let data = erc20_instance.methods.transfer(toAddress, web3.utils.toWei(amount, 'ether')).encodeABI();

              let gasLimit = await web3.eth.estimateGas({
                to: wallet.contractAddress,
                data: data,
                from: wallet.address,
              });

              let processing_txns = WalletTransactions.find({
                fromWallet: fromWalletId,
                internalStatus: 'processing',
              }).count();

              let isInternalTxn = false;
              let internalWallet = Wallets.findOne({
                address: toAddress,
                coinType: 'ERC20',
                tokenSymbol: wallet.tokenSymbol,
              });

              if (internalWallet) {
                isInternalTxn = true;
              }

              if (processing_txns > 0) {
                nonce = nonce + processing_txns;
                var rawTx = {
                  gasPrice: web3.utils.toHex(gasPrice),
                  gasLimit: web3.utils.toHex(gasLimit),
                  from: wallet.address,
                  nonce: web3.utils.toHex(nonce),
                  to: wallet.contractAddress,
                  data: data,
                  value: web3.utils.toHex(web3.utils.toWei('0', 'ether')),
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
                  internalStatus: 'processing',
                  status: isInternalTxn ? 'completed' : 'pending',
                  isInternalTxn,
                  txnId: web3.utils.sha3('0x' + serializedTx.toString('hex'), { encoding: 'hex' }),
                  type: 'withdrawal',
                  fee: web3.utils.fromWei(new BigNumber(gasPrice).multipliedBy(gasLimit).toString(), 'ether'),
                  nonce: nonce,
                  rawTx: '0x' + serializedTx.toString('hex'),
                  feeDepositWallet: null,
                  feeDepositTxnId: null,
                  feeDepositGasPrice: null, //both txns should go with same gas price
                });

                Wallets.update(
                  {
                    _id: wallet._id,
                  },
                  {
                    $set: {
                      confirmedBalance: await getBalance(wallet._id),
                    },
                  }
                );

                if (internalWallet) {
                  WalletTransactions.upsert(
                    {
                      toWallet: internalWallet._id,
                      fromAddress: wallet.address,
                      txnId: web3.utils.sha3('0x' + serializedTx.toString('hex'), { encoding: 'hex' }),
                      type: 'deposit',
                    },
                    {
                      $set: {
                        createdAt: Date.now(),
                        amount: amount,
                        internalStatus: 'pending',
                        status: 'completed',
                        isInternalTxn: true,
                      },
                    }
                  );

                  Wallets.update(
                    {
                      _id: internalWallet._id,
                    },
                    {
                      $set: {
                        confirmedBalance: await getBalance(internalWallet._id),
                      },
                    }
                  );
                }

                resolve(return_id);
              } else {
                var rawTx = {
                  gasPrice: web3.utils.toHex(gasPrice),
                  gasLimit: web3.utils.toHex(gasLimit),
                  from: wallet.address,
                  nonce: web3.utils.toHex(nonce),
                  to: wallet.contractAddress,
                  data: data,
                  value: web3.utils.toHex(web3.utils.toWei('0', 'ether')),
                };

                const cryptr = new Cryptr(options.password);
                let privateKey_decrypted = cryptr.decrypt(wallet.privateKey);

                let tx = new EthereumTx(rawTx);
                const privateKey = Buffer.from(privateKey_decrypted, 'hex');
                tx.sign(privateKey);
                const serializedTx = tx.serialize();

                let hash = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));

                const return_id = WalletTransactions.insert({
                  fromWallet: wallet._id,
                  toAddress: toAddress,
                  amount: amount,
                  createdAt: Date.now(),
                  internalStatus: 'pending',
                  status: isInternalTxn ? 'completed' : 'pending',
                  isInternalTxn,
                  txnId: hash.transactionHash,
                  nonce: nonce,
                  type: 'withdrawal',
                  fee: web3.utils.fromWei(new BigNumber(gasPrice).multipliedBy(gasLimit).toString(), 'ether'),
                  lastBroadcastedDate: Date.now(),
                  rawTx: '0x' + serializedTx.toString('hex'),
                  feeDepositWallet: null,
                  feeDepositTxnId: null,
                  feeDepositGasPrice: null, //both txns should go with same gas price
                });

                Wallets.update(
                  {
                    _id: wallet._id,
                  },
                  {
                    $set: {
                      confirmedBalance: await getBalance(wallet._id),
                    },
                  }
                );

                if (internalWallet) {
                  WalletTransactions.upsert(
                    {
                      toWallet: internalWallet._id,
                      fromAddress: wallet.address,
                      txnId: hash.transactionHash,
                      type: 'deposit',
                    },
                    {
                      $set: {
                        createdAt: Date.now(),
                        amount: amount,
                        internalStatus: 'pending',
                        status: 'completed',
                        isInternalTxn: true,
                      },
                    }
                  );

                  Wallets.update(
                    {
                      _id: internalWallet._id,
                    },
                    {
                      $set: {
                        confirmedBalance: await getBalance(internalWallet._id),
                      },
                    }
                  );
                }

                resolve(return_id);
              }
            } else {
              reject('Insufficient Tokens');
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
      if (err.toString().includes('insufficient funds')) {
        reject('Insufficient Funds');
      } else {
        reject(err.toString());
      }
    }
  });
}

async function getWalletTransactions(walletId, userId, type = 'withdrawal') {
  userId = userId || Meteor.userId();
  const wallet = Wallets.find({
    _id: walletId,
    userId,
  });

  if (!wallet) {
    return Promise.reject(new Error('Invalid wallet id'));
  }

  if (type === 'withdrawal') {
    return WalletTransactions.find({
      fromWallet: wallet._id,
    }).fetch();
  } else {
    return WalletTransactions.find({
      toWallet: wallet._id,
    }).fetch();
  }
}

function isUserSubscribedToPaymeter(userId) {
  let obj = PaymeterCollection.findOne({
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

async function paymeter_getAndResetUserBill({ userId, isFromFrontEnd, selectedMonth }) {
  selectedMonth = selectedMonth || moment();
  if (userId) {
    const billingPeriodLabel = selectedMonth.format('MMM-YYYY');
    let paymeter_userData = PaymeterCollection.findOne({ userId: userId });
    const paymeterPricing = PaymeterPricing.find({ active: true }).fetch()[0];
    if (paymeter_userData) {
      // if (paymeter_userData.subscribed) {
      let bill = paymeter_userData.bill || '0';
      let nextMonthMin = new BigNumber(paymeterPricing.minimumMonthlyCost);

      if (paymeter_userData.unsubscribeNextMonth && !isFromFrontEnd) {
        let UserWallets = Wallets.find({
          userId: userId,
        }).fetch();

        UserWallets.forEach(wallet => {
          WalletTransactions.remove({
            fromWallet: wallet._id,
          });

          WalletTransactions.remove({
            toWallet: wallet._id,
          });
        });

        Wallets.remove({
          userId: userId,
        });

        PaymeterCollection.upsert(
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

        nextMonthMin = 0;
      }

      if (new BigNumber(bill).lt(new BigNumber(paymeter_userData.minimumFeeThisMonth))) {
        bill = new BigNumber(paymeter_userData.minimumFeeThisMonth);
      }

      const vouchers = paymeter_userData.vouchers;
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
            const _discount = Number(Voucher.getDiscountAmountForVoucher(voucher, bill));
            if (_discount > bill - discount && _discount > 0) {
              _discount = bill - discount;
              discountsApplied.push({ _id: voucher._id, code: voucher.code, amount: _discount });
            }
            discount = discount + _discount;
          });
        bill = Math.max(0, Number(bill) - discount);
      }

      const history = PaymeterBillHistory.find({ billingPeriodLabel, userId }).fetch()[0];
      if (history) {
        return { bill: history.bill, discount: history.totalDiscountGiven };
      } else if (!isFromFrontEnd) {
        delete paymeter_userData.subscriptions;
        delete paymeter_userData.userId;
        PaymeterBillHistory.insert({
          billingPeriodLabel,
          userId,
          bill: Number(bill),
          metadata: paymeter_userData,
          discountsApplied,
          totalDiscountGiven: discount,
        });
      }

      // Reset it to 0 only if call is via generate bill script i.e. from backend
      if (!isFromFrontEnd) {
        PaymeterCollection.upsert(
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
      return { bill: new BigNumber(bill), discount };
    } else {
      return { bill: 0, discount: 0 };
    }
  } else {
    return { bill: 0, discount: 0 };
  }
}

//this can be used in case deposits are coming from a smart contract
async function refreshBalance(walletId) {
  return new Promise(async (resolve, reject) => {
    try {
      Wallets.update(
        {
          _id: walletId,
        },
        {
          $set: {
            confirmedBalance: await getBalance(walletId),
          },
        }
      );

      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

Meteor.methods({
  createWallet: async (coinType, walletName, network, options) => {
    if (Meteor.userId()) {
      try {
        let walletId = await createWallet(coinType, walletName, Meteor.userId(), network, options);
        return walletId;
      } catch (e) {
        throw new Meteor.Error(e, e);
      }
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
  refreshBalance: async walletId => {
    if (Meteor.userId()) {
      try {
        await refreshBalance(walletId, Meteor.userId());
      } catch (e) {
        throw new Meteor.Error(e, e);
      }
    } else {
      throw new Meteor.Error('Not Allowed', 'Please login');
    }
  },
  subscribePaymeter: async () => {
    const isPaymentMethodVerified = await Billing.isPaymentMethodVerified(Meteor.userId());
    const paymeterPricing = PaymeterPricing.find({ active: true }).fetch()[0];

    if (isPaymentMethodVerified) {
      let paymeter_userData = PaymeterCollection.findOne({ userId: Meteor.userId() });

      if (paymeter_userData) {
        if (paymeter_userData.unsubscribeNextMonth) {
          PaymeterCollection.upsert(
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
          let perDayCost = new BigNumber(paymeterPricing.minimumMonthlyCost).dividedBy(totalDaysThisMonth);
          let minimumFeeThisMonth = new BigNumber(perDayCost).times(helpers.getRemainingDays() + 1); //including today
          PaymeterCollection.upsert(
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
        let perDayCost = new BigNumber(paymeterPricing.minimumMonthlyCost).dividedBy(totalDaysThisMonth);
        let minimumFeeThisMonth = new BigNumber(perDayCost).times(helpers.getRemainingDays() + 1); //including today
        PaymeterCollection.upsert(
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
  unsubscribePaymeter: async () => {
    const isPaymentMethodVerified = await Billing.isPaymentMethodVerified(Meteor.userId());

    if (Meteor.userId()) {
      if (isPaymentMethodVerified) {
        PaymeterCollection.upsert(
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
  adminUnsubscribePaymeter: async userId => {
    if (Meteor.user().admin < 2) {
      throw new Meteor.Error(401, 'Unauthorized');
    }
    ElasticLogger.log('Admin paymeter unsubscribe', { userId, adminId: Meteor.userId() });
    PaymeterCollection.upsert(
      {
        userId,
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
    return true;
  },
  updateCallbackURLPayment: async notifyURL => {
    PaymeterCollection.upsert(
      {
        userId: Meteor.userId(),
      },
      {
        $set: {
          notifyURL: notifyURL,
        },
      }
    );
  },
});

async function adminChangeMinimumPaymeterBill({ paymeter, value }) {
  if (Meteor.user().admin < 2) {
    throw new Meteor.Error(401, 'Unauthorized');
  }
  PaymeterCollection.update(
    {
      _id: paymeter,
    },
    {
      $set: {
        minimumFeeThisMonth: Number(value),
      },
    }
  );
  return true;
}

module.exports = {
  createWallet,
  getBalance,
  getEthDetectedBalance,
  getBalanceCallback: async (_id, func) => {
    try {
      let balance = await getBalance(_id);
      func(null, balance);
    } catch (e) {
      func(e.toString());
    }
  },
  refreshBalance,
  transfer,
  getNonce,
  erc20ABI,
  getWalletTransactions,
  getBill: paymeter_getAndResetUserBill,
};

Meteor.methods({
  adminChangeMinimumPaymeterBill,
});
