import {Wallets} from "../wallets.js"
import WalletMethods from '../../../api/paymeter/index.js'; 
let Future = Npm.require('fibers/future');
import {WalletTransactions} from "../../walletTransactions/walletTransactions.js"
//"async" function always returns an promise.

Meteor.publishTransformed('wallets', function() {
  return Wallets.find({user: this.userId}).serverTransform((doc) => {
    let myFuture = new Future();

    let txns = WalletTransactions.find({
      fromWallet: doc._id
    }).fetch()

    WalletMethods.getBalanceCallback(doc._id, (err, balance) => {
      if(err) {
        doc.balance = 0
        doc.txns = txns
        myFuture.return(doc);
      } else {
        doc.balance = balance
        doc.txns = txns
        myFuture.return(doc);
      }
    })

    return myFuture.wait();
  });
});