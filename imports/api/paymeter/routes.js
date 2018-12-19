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
  console.log('Error', message);
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
  const wallets = Wallets.find(
    {
      user: req.userId,
    },
    {
      fields: { privateKey: 0 },
    }
  ).fetch();

  try {
    return sendSuccess(res, wallets);
  } catch (err) {
    return sendError(res, 400, err);
  }
});

JsonRoutes.add('get', '/api/paymeter/wallets/:id', async (req, res) => {
  const wallet = Wallets.find(
    {
      _id: req.params.id,
      user: req.userId,
    },
    {
      fields: {
        privateKey: 0,
      },
    }
  ).fetch()[0];

  if (!wallet) {
    return sendError(res, 400, 'Invalid wallet id');
  }

  try {
    return sendSuccess(res, {
      wallet,
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
    const transactions = await Paymeter.getWalletTransactions(req.params.id, req.userId);
    return sendSuccess(res, transactions);
  } catch (err) {
    return sendError(res, 400, err);
  }
});

JsonRoutes.add('post', '/api/paymeter/wallets/:id/send', async (req, res) => {
  const fromWalletId = req.params.id;
  const { toAddress, amount, options } = req.body;
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
    const result = await Paymeter.transfer(fromWalletId, toAddress, amount, options || {}, req.userId);
    return sendSuccess(res, { txnId: result });
  } catch (err) {
    sendError(res, 400, err);
  }
});
