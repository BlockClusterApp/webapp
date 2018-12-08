import Config from '../modules/config/server';
import {Wallets} from '../collections/wallets/wallets.js'
const Web3 = require('web3');
var Wallet = require('ethereumjs-wallet');
import helpers from '../modules/helpers';
const Cryptr = require('cryptr');
const BigNumber = require('bignumber.js');

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
            network: network,
            createdAt: Date.now()
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
            network: network,
            createdAt: Date.now()
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

        if(wallet) {
            if(coinType === 'ETH') {
                let web3 = new Web3(new Web3.providers.HttpProvider(`http://${await Config.getPaymeterConnectionDetails("eth", wallet.network)}`));

                web3.eth.getBlockNumber((err, latestBlockNumber) => {
                    if(!err) {
                        web3.eth.getBalance(wallet.address, latestBlockNumber - 12, (error, minedBalance) => {
                            if(!error) {
                                web3.eth.getBalance(wallet.address, "pending", (error, unminedBalance) => {
                                    if(!error) {
                                        let confirmedBalance = 0;
                                        if(((new BigNumber(minedBalance.toString())).minus(unminedBalance.toString())).isGreaterThanOrEqualTo(0)) {
                                            confirmedBalance = ((new BigNumber(minedBalance.toString())).minus(unminedBalance.toString())).toString();
                                        }

                                        if(((new BigNumber(minedBalance.toString())).minus(unminedBalance.toString())).isLessThan(0)) {
                                            //Suppose u had 500 in -12 block
                                            //at a time spend 200 and deposit 600
                                            //so 500 - (600 + 200) = -300
                                            //so +300 final confirmed balance
                                            confirmedBalance = (((new BigNumber(minedBalance.toString())).minus(unminedBalance.toString())).toString()).substr(1);
                                        }

                                        resolve(((new BigNumber(confirmedBalance)).toFixed(5)).toString())
                                    } else {
                                        console.log(error)
                                        reject('An error occured')
                                    }
                                })
                            } else {
                                console.log(error)
                                reject('An error occured')
                            }
                        })
                    } else {
                        reject("An error occured")
                    }
                })
            } else if(coinType === 'ERC20') {
                let web3 = new Web3(new Web3.providers.HttpProvider(`http://${await Config.getPaymeterConnectionDetails("eth", wallet.network)}`));
    
                let erc20 = web3.eth.contract(erc20ABI)
                let erc20_instance = erc20.at(wallet.contractAddress)

                web3.eth.getBlockNumber((err, latestBlockNumber) => {
                    if(!err) {
                        erc20_instance.balanceOf.call(wallet.address, latestBlockNumber - 12, (error, minedBalance) => {
                            if(!error) {
                                erc20_instance.balanceOf.call(wallet.address, "pending", (error, unminedBalance) => {
                                    if(!error) {
                                        let confirmedBalance = 0;
                                        if(((new BigNumber(minedBalance.toString())).minus(unminedBalance.toString())).isGreaterThanOrEqualTo(0)) {
                                            confirmedBalance = ((new BigNumber(minedBalance.toString())).minus(unminedBalance.toString())).toString();
                                        }

                                        if(((new BigNumber(minedBalance.toString())).minus(unminedBalance.toString())).isLessThan(0)) {
                                            confirmedBalance = (((new BigNumber(minedBalance.toString())).minus(unminedBalance.toString())).toString()).substr(1);
                                        }

                                        resolve(((new BigNumber(confirmedBalance)).toFixed(5)).toString())
                                    } else {
                                        console.log(error, "xxxx")
                                        reject('An error occured')
                                    }
                                })                           
                            } else {
                                reject('An error occured')
                            }

                        })
                    } else {
                        reject("An error occured")
                    }
                })
            } else if(coinType === 'ERC20-GasTank') {
                let web3 = new Web3(new Web3.providers.HttpProvider(`http://${await Config.getPaymeterConnectionDetails("eth", wallet.network)}`));
    
                web3.eth.getBlockNumber((err, latestBlockNumber) => {
                    if(!err) {
                        web3.eth.getBalance(wallet.address, latestBlockNumber - 12, (error, minedBalance) => {
                            if(!error) {
                                web3.eth.getBalance(wallet.address, "pending", (error, unminedBalance) => {
                                    if(!error) {
                                        let confirmedBalance = 0;
                                        if(((new BigNumber(minedBalance.toString())).minus(unminedBalance.toString())).isGreaterThanOrEqualTo(0)) {
                                            confirmedBalance = ((new BigNumber(minedBalance.toString())).minus(unminedBalance.toString())).toString();
                                        }

                                        if(((new BigNumber(minedBalance.toString())).minus(unminedBalance.toString())).isLessThan(0)) {
                                            //Suppose u had 500 in -12 block
                                            //at a time spend 200 and deposit 600
                                            //so 500 - (600 + 200) = -300
                                            //so +300 final confirmed balance
                                            confirmedBalance = (((new BigNumber(minedBalance.toString())).minus(unminedBalance.toString())).toString()).substr(1);
                                        }

                                        resolve(((new BigNumber(confirmedBalance)).toFixed(5)).toString())
                                    } else {
                                        reject('An error occured')
                                    }
                                })
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

Meteor.methods({
    'createWallet': (coinType, walletName, network, options) => {
        if(Meteor.userId()) {
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
        } catch(e) {
            func("An error occured")
        }
    }
}