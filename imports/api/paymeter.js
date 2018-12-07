import Config from '../modules/config/server';
import {Wallets} from '../collections/wallets/wallets.js'
const Web3 = require('web3');
var Wallet = require('ethereumjs-wallet');
import helpers from '../modules/helpers';
const Cryptr = require('cryptr');

const erc20ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}];

function createWallet(coinType, walletName, userId, network, options) {
    if(coinType === 'ETH') {
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
            network: network
        })
    } else if(coinType === 'ERC20') {
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
            network: network
        })      
    } else if(coinType === 'ERC20-GasTank') {
        let wallet = Wallet.generate();
        let private_key_hex = wallet.getPrivateKey().toString('hex');
        let address = wallet.getAddress();

        Wallets.insert({
            coinType: 'ERC20-GasTank',
            privateKey: private_key_hex,
            address: '0x' + address.toString('hex'),
            user: userId,
            walletName: walletName,
            network: network
        })
    } else {
        return false;
    }

    return true;
}

function getBalance(walletId) {
    return new Promise((resolve, reject) => {
        let wallet = Wallets.findOne({
            _id: walletId
        })

        let coinType = wallet.coinType;

        if(coinType === 'ETH') {
            let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.getPaymeterConnectionDetails("eth", wallet.network)}`));

            if(wallet) {
                web3.eth.getBalance(wallet.address, (error, balance) => {
                    console.log(error, balance)
                    if(!error) {
                        resolve(web3.fromWei(balance, 'ether'))
                    } else {
                        reject('An error occured')
                    }
                })
            } else {
                reject('Wallet not found')
            }
        } else if(coinType === 'ERC20') {
            let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.getPaymeterConnectionDetails("eth", wallet.network)}`));

            let erc20 = web3.eth.contract(erc20ABI)
            let erc20_instance = erc20.at(wallet.contractAddress)
            erc20_instance.balanceOf.call(wallet.address, (error, balance) => {
                if(error) {
                    reject('An error occured')
                } else {
                    resolve(web3.fromWei(balance, 'ether'))
                }
            })
        } else if(coinType === 'ERC20-GasTank') {
            let web3 = new Web3(new Web3.providers.HttpProvider(`http://${Config.getPaymeterConnectionDetails("eth", wallet.network)}`));

            if(wallet) {
                web3.eth.getBalance(wallet.address, (error, balance) => {
                    if(!error) {
                        resolve(web3.fromWei(balance, 'ether'))
                    } else {
                        reject('An error occured')
                    }
                })
            } else {
                reject('Wallet not found')
            }
        } else {
            reject('Invalid coin type');
        }
    })
}

Meteor.methods({
    'createWallet': (coinType, walletName, network, options) => {
        if(Meteor.userId()) {
            return createWallet(coinType, walletName, Meteor.userId(), network, options);
        } else {
            throw new Meteor.Error('Not Allowed', 'Please login');
        }
    }
})

module.exports = {
    createWallet: createWallet,
    getBalance: getBalance
}