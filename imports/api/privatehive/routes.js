import AuthMiddleware from '../middleware/auth';
import RateLimiter from '../../modules/helpers/server/rate-limiter';
import PrivatehiveApis from './index';
import NetworkConfiguration from '../../collections/network-configuration/network-configuration';
import Invites from '../server-functions/user-functions';

function authMiddleware(req, res, next) {
  // if (!(RemoteConfig.features && RemoteConfig.features.Privatehive)) {
  //   return JsonRoutes.sendResult(res, {
  //     code: 401,
  //     data: {
  //       error: 'Not available in this licence',
  //     },
  //   });
  // }

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

JsonRoutes.Middleware.use('/api/platform/privatehive/', authMiddleware);
JsonRoutes.Middleware.use('/api/platform/privatehive/', async (req, res, next) => {
  const isAllowed = await RateLimiter.isAllowed('privatehive-api', req.userId);
  if (!isAllowed) {
    return sendError(res, 429, 'You are being rate limited. Try in some time');
  }
  next();
});

JsonRoutes.add('post', '/api/platform/privatehive', async (req, res) => {
  const { peerId, locationCode, type, voucherCode, name, orgName, ordererType, networkConfigId, diskSpace } = req.body;
  const userId = req.userId;
  let voucherId;
  if (voucherCode) {
    try {
      const voucher = await Voucher.validate({ voucherCode, userId, type: 'privatehive' });
      voucherId = voucher._id;
    } catch (err) {
      return sendError(res, 403, err.toString());
    }
  }

  const networkConfig = NetworkConfiguration.findOne({ _id: networkConfigId });
  if (type === 'peer' && diskSpace && !isNaN(Number(diskSpace))) {
    networkConfig.disk = diskSpace;
  }

  try {
    const result = await PrivatehiveApis.createPrivateHiveNetwork({ userId, peerId, locationCode, type, voucherId, name, orgName, ordererType, networkConfig });
    sendSuccess(res, { instanceId: result });
  } catch (err) {
    sendError(res, 400, err.toString());
  }
});

JsonRoutes.add('delete', '/api/platform/privatehive/:instanceId', async (req, res) => {
  if (!req.params.instanceId) {
    return sendError(res, 400, 'InstanceID missing');
  }

  try {
    const result = await PrivatehiveApis.deleteNetwork({ userId: req.userId, instanceId: req.params.instanceId });
    sendSuccess(res, { instanceId: req.params.instanceId });
  } catch (err) {
    sendError(res, 400, err.toString());
  }
});

JsonRoutes.add('post', '/api/platform/privatehive/invite', async (req, res) => {
  const { channelName, networkId, email, ordererDomain, ordererConnectionDetails } = req.body;

  try {
    const result = await Invites.inviteUserToChannel({ channelName, networkId, email, userId: req.userId, ordererDomain, ordererConnectionDetails });
    sendSuccess(res, { instanceId: result });
  } catch (err) {
    sendError(res, 400, err.toString());
  }
});

JsonRoutes.add('post', '/api/platform/privatehive/invite/accept/:inviteId', async (req, res) => {
  const { peerId } = req.body;
  const { inviteId } = req.params;

  if (!inviteId) {
    return sendError(res, 400, 'InviteID is required');
  }
  if (!peerId) {
    return sendError(res, 400, 'PeerID is required');
  }

  try {
    const result = await Invites.acceptInvitation({ inviteId, userId: req.userId, peerInstanceId: peerId });
    sendSuccess(res, { instanceId: result });
  } catch (err) {
    sendError(res, 400, err.toString());
  }
});

JsonRoutes.add('delete', '/api/platform/privatehive/invite/:inviteId', async (req, res) => {
  const { inviteId } = req.params;
  try {
    const result = await Invites.cancelInvitation({ inviteId, userId: req.userId });
    sendSuccess(res, { instanceId: result });
  } catch (err) {
    sendError(res, 400, err.toString());
  }
});
