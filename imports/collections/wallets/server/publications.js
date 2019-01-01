import { Wallets } from '../wallets.js';
import WalletMethods from '../../../api/paymeter/index.js';
let Future = Npm.require('fibers/future');
import { WalletTransactions } from '../../walletTransactions/walletTransactions.js';
//"async" function always returns an promise.

Meteor.publishTransformed('wallets', function() {
  return Wallets.find({ user: this.userId }, { fields: { privateKey: 0 } }).serverTransform(doc => {
    let withdrawl_txns = WalletTransactions.find({
      fromWallet: doc._id,
      type: 'withdrawal',
    }).fetch();

    let deposit_txns = WalletTransactions.find({
      toWallet: doc._id,
      type: 'deposit',
    }).fetch();

    doc.withdrawl_txns = withdrawl_txns;
    doc.deposit_txns = deposit_txns;

    return doc;
  });
});
