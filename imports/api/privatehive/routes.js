import AuthMiddleware from '../middleware/auth';
import RateLimiter from '../../modules/helpers/server/rate-limiter';

function authMiddleware(req, res, next) {
  if (!(RemoteConfig.features && RemoteConfig.features.Privatehive)) {
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

JsonRoutes.Middleware.use('/api/privatehives/', authMiddleware);
JsonRoutes.Middleware.use('/api/privatehives/', async (req, res, next) => {
  const isAllowed = await RateLimiter.isAllowed('privatehive-api', req.userId);
  if (!isAllowed) {
    return sendError(res, 429, 'You are being rate limited. Kindly try in some time');
  }
  next();
});

JsonRoutes.add('post', '/api/privatehives');
JsonRoutes.add('delete', '/api/privatehives');
JsonRoutes.add('post', '/api/privatehives/invites');
JsonRoutes.add('post', '/api/privatehives/invites/accept');
JsonRoutes.add('delete', '/api/privatehives/invites'); // Cancel invite
