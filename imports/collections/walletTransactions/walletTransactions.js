import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

const txn = new Mongo.Collection('walletTransactions');

if (Meteor.isServer) {
  txn._ensureIndex(
    {
      toWallet: 1,
      fromAddress: 1,
      txnId: 1,
      type: 1,
    },
    {
      unique: true,
    }
  );
  txn._ensureIndex({
    txnId: 1,
  });
  txn._ensureIndex({
    txnId: 1,
    type: 1,
  });
  txn._ensureIndex({
    fromWallet: 1,
    internalStatus: 1,
    isInternalTxn: 1,
    type: 1,
  });
  txn._ensureIndex({
    toWallet: 1,
    internalStatus: 1,
    isInternalTxn: 1,
    type: 1,
  });
  txn._ensureIndex({
    fromWallet: 1,
    internalStatus: 1,
  });
}

export const WalletTransactions = txn;
