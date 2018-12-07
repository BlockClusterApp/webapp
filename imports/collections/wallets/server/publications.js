import {Wallets} from "../wallets.js"
import WalletMethods from "../../../api/paymeter"

Meteor.publishTransformed('wallets', function() {
  return Wallets.find({user: this.userId}).serverTransform({
    balance: async function(doc) {
      try {
        let balance = await WalletMethods.getBalance(doc._id);
        return balance;
      } catch(e) {
        return 0;
      }
    }
  });
});