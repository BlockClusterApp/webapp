import Bluebird from 'bluebird';

import AuthMiddleware from '../middleware/auth';
import Paymeter from './';

const { Wallets } = require('../../collections/wallets/wallets');

function authMiddleware(req, res, next) {
  if (!(RemoteConfig.features && RemoteConfig.features.Paymeter)) {
    return JsonRoutes.sendResult(res, {
      code: 401,
      data: {
        error: 'Not available in this licence',
      },
    });
  }

  AuthMiddleware(req, res, next);
}

function sendError(res, statusCode, message) {
  JsonRoutes.sendResult(res, {
    code: statusCode,
    data: {
      success: false,
      error: message,
    },
  });
}

function sendSuccess(res, data) {
  JsonRoutes.sendResult(res, {
    code: 200,
    data: {
      success: true,
      data,
    },
  });
}

JsonRoutes.Middleware.use('/api/paymeter', authMiddleware);

JsonRoutes.add('get', '/api/paymeter/wallets', (req, res) => {
  const wallets = Wallets.find({
    userId: req.userId,
  }).fetch();

  try {
    Bluebird.each(wallets, async wallet => {
      wallet.balance = await Paymeter.getBalance(wallet._id);
    });
    return sendSuccess(res, wallets);
  } catch (err) {
    return sendError(res, 400, err);
  }
});

JsonRoutes.add('get', '/api/paymeter/wallets/:id', async (req, res) => {
  const wallet = Wallets.find({
    _id: req.params.id,
    userId: req.userId,
  }).fetch()[0];

  if (!wallet) {
    return sendError(res, 400, 'Invalid wallet id');
  }

  try {
    const { balance, txns } = await Bluebird.props({ balance: Paymeter.getBalance(wallet._id), txns: Paymeter.getWalletTransactions(wallet._id, req.userId) });
    return sendSuccess(res, {
      wallet,
      balance,
      transactions: txns,
    });
  } catch (err) {
    return sendError(res, 400, err);
  }
});

JsonRoutes.add('post', '/api/paymeter/wallets', async (req, res) => {
  const { coinType, walletName, network, options } = req.body;

  if (!coinType) {
    return sendError(res, 400, 'coinType is required field');
  }

  if (!walletName) {
    return sendError(res, 400, 'walletName is required');
  }

  if (!network) {
    return sendError(res, 400, 'network is required');
  }

  try {
    const result = await Paymeter.createWallet(coinType, walletName, req.userId, network, options || {});
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, 400, err);
  }
});

JsonRoutes.add('get', '/api/paymeter/wallets/:id/withdrawals', async (req, res) => {
  try {
    const transactinos = await Paymeter.getWalletTransactions(req.params.id, req.userId);
    return sendSuccess(res, transactinos);
  } catch (err) {
    return sendError(res, 400, err);
  }
});

JsonRoutes.add('post', '/api/paymeter/wallets/:id/send', async (req, res) => {
  const { fromWalletId, toAddress, amount, options } = req.body;
  if (!fromWalletId) {
    return sendError(res, 400, 'fromWalletId is required field');
  }
  if (!toAddress) {
    return sendError(res, 400, 'toAddress is required field');
  }
  if (!amount) {
    return sendError(res, 400, 'amount is required field');
  }
  try {
    const result = await Paymeter.transfer(fromWalletId, toAddress, amount, options || {});
    return sendSuccess(res, { txnHash: result });
  } catch (err) {
    sendError(res, 400, err);
  }
});
