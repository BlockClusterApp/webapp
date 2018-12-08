import Config from '../modules/config/server';
import {
  Wallets
} from '../collections/wallets/wallets.js'
const Web3 = require('web3');
let Wallet = require('ethereumjs-wallet');
import {
  WalletTransactions
} from '../collections/walletTransactions/walletTransactions.js'
import helpers from '../modules/helpers';
const Cryptr = require('cryptr');
const BigNumber = require('bignumber.js');
const EthereumTx = require('ethereumjs-tx')

const erc20ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}];

function createWallet(coinType, walletName, userId, network, options) {
  if (coinType === 'ETH') {
    let wallet = Wallet.generate();
    let private_key_hex = wallet.getPrivateKey().toString('hex');
    let address = wallet.getAddress();
    const cryptr = new Cryptr(private_key_hex);

    Wallets.insert({
      coinType: 'ETH',
      privateKey: cryptr.encrypt(options.password),
      address: '0x' + address.toString('hex'),
      user: userId,
      walletName: walletName,
      network: network,
      createdAt: Date.now()
    })
  } else if (coinType === 'ERC20') {
    let wallet = Wallet.generate();
    let private_key_hex = wallet.getPrivateKey().toString('hex');
    let address = wallet.getAddress();
    const cryptr = new Cryptr(private_key_hex);

    Wallets.insert({
      coinType: 'ERC20',
      privateKey: cryptr.encrypt(options.password),
      address: '0x' + address.toString('hex'),
      user: userId,
      contractAddress: options.contractAddress,
      tokenSymbol: options.tokenSymbol,
      walletName: walletName,
      network: network,
      createdAt: Date.now()
    })
  } else {
    return false;
  }

  return true;
}

async function getBalance(walletId) {
  return new Promise(async (resolve, reject) => {
    let wallet = Wallets.findOne({
      _id: walletId
    })

    let coinType = wallet.coinType;

    if (wallet) {
      if (coinType === 'ETH') {
        let web3 = new Web3(new Web3.providers.HttpProvider(`${await Config.getPaymeterConnectionDetails("eth", wallet.network)}`));

        web3.eth.getBlockNumber((err, latestBlockNumber) => {
          if (!err) {
            web3.eth.getBalance(wallet.address, latestBlockNumber - 15, (error, minedBalance) => {
              if (!error) {
                minedBalance = (web3.fromWei(minedBalance, 'ether')).toString();
                
                //later on here find the "pending" send txns from DB and deduct from mindedBalance then show.

                resolve(((new BigNumber(minedBalance)).toFixed(5)).toString())
              } else {
                reject('An error occured')
              }
            })
          } else {
            reject("An error occured")
          }
        })
      } else if (coinType === 'ERC20') {
        let web3 = new Web3(new Web3.providers.HttpProvider(`${await Config.getPaymeterConnectionDetails("eth", wallet.network)}`));

        let erc20 = web3.eth.contract(erc20ABI)
        let erc20_instance = erc20.at(wallet.contractAddress)

        web3.eth.getBlockNumber((err, latestBlockNumber) => {
          if (!err) {
            erc20_instance.balanceOf.call(wallet.address, latestBlockNumber - 15, (error, minedBalance) => {
              if (!error) {
                minedBalance = (web3.fromWei(minedBalance, 'ether')).toString();

                //later on here find the "pending" send txns from DB and deduct from mindedBalance then show.

                resolve(((new BigNumber(minedBalance)).toFixed(5)).toString())
              } else {
                reject('An error occured')
              }

            })
          } else {
            reject("An error occured")
          }
        })
      } else {
        reject('Invalid coin type');
      }
    } else {
      reject('Wallet not found')
    }
  })
}

async function getNonce(address, url) {
  let web3 = new Web3(new Web3.providers.HttpProvider(url));

  return new Promise((resolve, reject) => {
    web3.eth.getTransactionCount(address, function(error, nonce) {
      if (!error) {
        resolve(nonce)
      } else {
        reject("An error occured")
      }
    })
  })
}

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

async function transfer(fromWalletId, toAddress, amount, options) {
  return new Promise(async (resolve, reject) => {
    let wallet = Wallets.findOne({
      _id: fromWalletId
    })

    let coinType = wallet.coinType;

    if (wallet) {
      if (coinType === 'ETH') {
        let url = await Config.getPaymeterConnectionDetails("eth", wallet.network);
        let web3 = new Web3(new Web3.providers.HttpProvider(url));
        let nonce = await getNonce(wallet.address, url)
        let gasPrice = await getGasPrice(url);
        var rawTx = {
          gasPrice: web3.toHex(gasPrice),
          gasLimit: web3.toHex(21000),
          from: wallet.address,
          nonce: web3.toHex(nonce),
          to: toAddress,
          value: web3.toHex(web3.toWei(amount))
        };

        let tx = new EthereumTx(rawTx);
        const cryptr = new Cryptr(options.password);
        
        let decryptedPrivateKey = cryptr.decrypt(wallet.privateKey);
        const privateKey = Buffer.from(decryptedPrivateKey, 'hex')
        tx.sign(privateKey)
        const serializedTx = tx.serialize()

        web3.eth.sendRawTransaction("0x" + serializedTx.toString("hex"), (err, hash) => {
          if (err) {
            reject(err)
          } else {
            WalletTransactions.insert({
              user: wallet.user,
              fromWallet: wallet._id,
              toAddress: toAddress,
              amount: amount,
              createdAt: Date.now()
            })

            resolve(hash)
          }
        })
      } else if (coinType === 'ERC20') {

      }
    } else {
      reject("Wallet not found");
    }
  })
}

Meteor.methods({
  'createWallet': (coinType, walletName, network, options) => {
    if (Meteor.userId()) {
      return createWallet(coinType, walletName, Meteor.userId(), network, options);
    } else {
      throw new Meteor.Error('Not Allowed', 'Please login');
    }
  },
  'getBalance': async (_id) => {
    return await getBalance(_id)
  }
})

module.exports = {
  createWallet: createWallet,
  getBalance: getBalance,
  getBalanceCallback: async (_id, func) => {
    try {
      let balance = await getBalance(_id);
      func(null, balance)
    } catch (e) {
      func("An error occured")
    }
  }
}