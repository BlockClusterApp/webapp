import {Wallets} from "../wallets.js"
import WalletMethods from '../../../api/paymeter/index.js'; 
let Future = Npm.require('fibers/future');
import {WalletTransactions} from "../../walletTransactions/walletTransactions.js"
//"async" function always returns an promise.

Meteor.publishTransformed('wallets', function() {
  return Wallets.find({user: this.userId}).serverTransform((doc) => {
    let myFuture = new Future();

    let withdrawl_txns = WalletTransactions.find({
      fromWallet: doc._id,
      type: 'withdrawal'
    }).fetch()

    let deposit_txns = WalletTransactions.find({
      toWallet: doc._id,
      type: 'deposit'
    }).fetch()

    WalletMethods.getBalanceCallback(doc._id, (err, balance) => {
      if(err) {
        doc.balance = 0
        doc.withdrawl_txns = withdrawl_txns
        doc.deposit_txns = deposit_txns
        myFuture.return(doc);
      } else {
        doc.balance = balance
        doc.withdrawl_txns = withdrawl_txns
        doc.deposit_txns = deposit_txns
        myFuture.return(doc);
      }
    })

    return myFuture.wait();
  });
});