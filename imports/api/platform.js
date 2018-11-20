import ApiKeys from '../collections/api-keys';
import NetworkConfig from '../api/network/network-configuration';
import NetworkConfiguration from '../collections/network-configuration/network-configuration';
import LocationApi from './locations';

async function validateToken(token) {
  const key = ApiKeys.find({
    key: token,
  }).fetch()[0];

  if (!key) {
    return false;
  }
  return key.userId;
}

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth.split(' ')[1];

  const userId = await validateToken(token);
  if (!userId) {
    JsonRoutes.sendResult(res, {
      code: 401,
      data: {
        success: false,
        error: 'Unauthorized',
      },
    });
  }

  req.userId = userId;
  req.user = Meteor.users.find({ _id: userId }).fetch()[0];
  next();
  return true;
}

JsonRoutes.add('get', '/ping', function(req, res, next) {
  JsonRoutes.sendResult(res, {
    code: 200,
    data: 'ping',
  });
});

JsonRoutes.Middleware.use('/api/platform', authMiddleware);

// Fetch Network Types for this user
JsonRoutes.add('get', '/api/platform/networks/types', async function(req, res) {
  const configs = await NetworkConfig.getConfigs();
  return JsonRoutes.sendResult(res, {
    code: 200,
    data: Object.values(configs),
  });
});

// Fetch All locations for this user
JsonRoutes.add('get', '/api/platform/networks/locations', async function(req, res) {
  const locations = LocationApi.getLocations();
  locations.forEach(loc => {
    delete loc.workerNodeIP;
  });
  return JsonRoutes.sendResult(res, {
    code: 200,
    data: locations,
  });
});

// Creates a network
JsonRoutes.add('post', '/api/platform/networks', function(req, res, next) {
  const { networkConfigId, locationCode, networkName, diskSpace } = req.body;

  const _networkConfig = NetworkConfiguration.find({
    _id: networkConfigId,
  }).fetch()[0];

  if (!_networkConfig) {
    return JsonRoutes.sendResult(res, {
      code: 400,
      data: {
        success: false,
        error: 'Invalid network configuration id',
      },
    });
  }

  const locations = LocationApi.getLocations();
  if (!locations.map(i => i.locationCode).includes(locationCode)) {
    return JsonRoutes.sendResult(res, {
      code: 400,
      data: {
        success: false,
        error: 'Invalid location code',
      },
    });
  }

  if (!networkName) {
    return JsonRoutes.sendResult(res, {
      code: 400,
      data: {
        success: false,
        error: 'networkName is a required parameter',
      },
    });
  }

  const networkConfig = {
    config: { ..._networkConfig },
  };

  if (networkConfig.isDiskChangeable && diskSpace) {
    if (isNaN(Number(diskSpace))) {
      return JsonRoutes.sendResult(res, {
        code: 400,
        data: {
          success: false,
          error: 'Invalid disk space. Should be a number',
        },
      });
    }
    networkConfig.diskSpace = Math.floor(Number(diskSpace));
  }

  Meteor.call('createNetwork', { networkName, locationCode, networkConfig, userId: req.userId }, (error, instanceId) => {
    if (error) {
      JsonRoutes.sendResult(res, {
        code: 400,
        error: error.message,
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 400,
        data: {
          success: true,
          data: { instanceId },
        },
      });
    }
  });
});

// Deletes a network
JsonRoutes.add('delete', '/api/platform/networks/:instanceId', function(req, res) {
  const { instanceId } = req.params;

  Meteor.call('deleteNetwork', instanceId, req.userId, (err, data) => {
    if (err) {
      JsonRoutes.sendResult(res, {
        code: 400,
        error: err.message,
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 400,
        data: {
          success: true,
        },
      });
    }
  });
});

// Sends an invite to email id
JsonRoutes.add('post', '/api/platform/networks/invite', function(req, res, next) {
  let user = req.user;
  let { inviteToEmail, networkId, networkType } = req.body;

  Meteor.call('inviteUserToNetwork', networkId, networkType, inviteToEmail, user._id, (error, inviteId) => {
    if (error) {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: { error: error.message || error.reason, success: false },
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          success: true,
          inviteId,
        },
      });
    }
  });
});

// Joins a network with custom params
JsonRoutes.add('post', '/api/platform/networks/join', function(req, res) {
  const {
    networkName,
    nodeType,
    genesisFileContent,
    totalENodes,
    impulseURL,
    assetsContractAddress,
    atomicSwapContractAddress,
    streamsContractAddress,
    impulseContractAddress,
    locationCode,
    networkConfigId,
  } = req.body;

  const data = {
    networkName,
    nodeType,
    genesisFileContent,
    totalENodes,
    impulseURL,
    assetsContractAddress,
    atomicSwapContractAddress,
    streamsContractAddress,
    impulseContractAddress,
    locationCode,
    networkConfigId,
  };

  const returned = false;
  Object.keys(data).forEach(key => {
    if (!data[key] && !returned) {
      returned = true;
      return JsonRoutes.sendResult(res, {
        code: 400,
        data: {
          success: false,
          error: `${key} is required`,
        },
      });
    }
  });

  if (returned) {
    return;
  }

  const locations = LocationApi.getLocations();
  if (!locations.map(i => i.locationCode).includes(locationCode)) {
    return JsonRoutes.sendResult(res, {
      code: 400,
      data: {
        success: false,
        error: 'Invalid location code',
      },
    });
  }

  const _networkConfig = NetworkConfiguration.find({
    _id: networkConfigId,
  }).fetch()[0];
  if (!_networkConfig) {
    return JsonRoutes.sendResult(res, {
      code: 400,
      data: {
        success: false,
        error: 'Invalid network configuration id',
      },
    });
  }
  const networkConfig = {
    config: { ..._networkConfig },
  };

  if (networkConfig.isDiskChangeable && diskSpace) {
    if (isNaN(Number(diskSpace))) {
      return JsonRoutes.sendResult(res, {
        code: 400,
        data: {
          success: false,
          error: 'Invalid disk space. Should be a number',
        },
      });
    }
    networkConfig.diskSpace = Math.floor(Number(diskSpace));
  }

  if (!Array.isArray(totalENodes)) {
    return JsonRoutes.sendResult(res, {
      code: 400,
      data: {
        success: false,
        error: 'totalENodes should be a valid json array',
      },
    });
  }

  Meteor.call(
    'joinNetwork',
    networkName,
    nodeType,
    genesisFileContent,
    totalENodes,
    impulseURL,
    assetsContractAddress,
    atomicSwapContractAddress,
    streamsContractAddress,
    impulseContractAddress,
    locationCode,
    networkConfig,
    req.user._id,
    (err, instanceId) => {
      if (error) {
        JsonRoutes.sendResult(res, {
          code: 401,
          data: { error: error.message || error.reason, success: false },
        });
      } else {
        JsonRoutes.sendResult(res, {
          code: 200,
          data: {
            success: true,
            data: {
              instanceId,
            },
          },
        });
      }
    }
  );
});

JsonRoutes.add('post', '/api/platform/networks/invite/accept', function(req, res) {
  const { inviteId, locationCode, networkConfigId } = req.body;

  const _networkConfig = NetworkConfiguration.find({
    _id: networkConfigId,
  }).fetch()[0];

  if (!_networkConfig) {
    return JsonRoutes.sendResult(res, {
      code: 400,
      data: {
        success: false,
        error: 'Invalid network configuration id',
      },
    });
  }

  const networkConfig = {
    config: { ..._networkConfig },
  };

  if (networkConfig.isDiskChangeable && diskSpace) {
    if (isNaN(Number(diskSpace))) {
      return JsonRoutes.sendResult(res, {
        code: 400,
        data: {
          success: false,
          error: 'Invalid disk space. Should be a number',
        },
      });
    }
    networkConfig.diskSpace = Math.floor(Number(diskSpace));
  }

  Meteor.call('acceptInvitation', inviteId, locationCode, networkConfig, req.user._id, (error, instanceId) => {
    if (error) {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: { error: error.message || error.reason, success: false },
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          success: true,
          data: {
            instanceId,
          },
        },
      });
    }
  });
});
