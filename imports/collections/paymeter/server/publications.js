import { Paymeter } from '../paymeter.js';
import { Wallets } from '../../wallets/wallets';
import { WalletTransactions } from '../../walletTransactions/walletTransactions';

const MIN_ADMIN_LEVEL = 1;
const pageSize = 20;

Meteor.publish('paymeter_user_data', function() {
  return Paymeter.find({ userId: this.userId });
});

Meteor.publish('paymeter.all', function() {
  if (Meteor.user().admin < 1) {
    return [];
  }
  const users = [];
  return Paymeter.find({});
});

Meteor.publish('paymeter.search', ({ query, limit, page, loadWallets }) => {
  if (Meteor.user() && Meteor.user().admin <= MIN_ADMIN_LEVEL) {
    return [];
  }
  limit = limit || pageSize;
  page = page || 1;

  const users = Paymeter.find(query, { fields: { userId: 1, _id: 1 } }).fetch();
  const userIds = users.map(p => p.userId);
  const arr = [Paymeter.find(query), Meteor.users.find({ _id: { $in: userIds } })];
  if (loadWallets) {
    const walletIds = Wallets.find(
      {
        user: {
          $in: userIds,
        },
      },
      {
        fields: {
          _id: 1,
        },
      }
    ).fetch();
    arr.push(
      Wallets.find({
        user: {
          $in: userIds,
        },
      })
    );
    arr.push(
      WalletTransactions.find({
        $or: [
          {
            toWallet: {
              $in: walletIds.map(w => w._id),
            },
          },
          {
            fromWallet: {
              $in: walletIds.map(w => w._id),
            },
          },
        ],
      })
    );
  }
  return arr;
});
