import {Wallets} from "../wallets.js"
import WalletMethods from "../../../api/paymeter"
let Future = Npm.require('fibers/future');

//"async" function always returns an promise.

Meteor.publishTransformed('wallets', function() {
  return Wallets.find({user: this.userId}).serverTransform((doc) => {
    let myFuture = new Future();

    WalletMethods.getBalanceCallback(doc._id, (err, balance) => {
      if(err) {
        doc.balance = 0
        myFuture.return(doc);
      } else {
        doc.balance = balance
        myFuture.return(doc);
      }
    })

    return myFuture.wait();
  });
});