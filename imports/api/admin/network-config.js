import NetworkConfiguration from '../../collections/network-configuration/network-configuration';

const Apis = {};

Apis.createNetworkConfig = async ({ userId, params, type }) => {
  userId = userId || Meteor.userId();
  type = type || 'dynamo';

  params.for = type;

  delete params.type;

  const user = Meteor.users.find({ _id: userId }).fetch()[0];

  if (user.admin < 2) {
    throw new Meteor.Error('Unauthorized to create network config');
  }

  const allowedFields = ['name', 'cpu', 'ram', 'disk', 'isDiskChangeable', 'cost.monthly', 'cost.hourly', '_id', 'showInNetworkSelection', 'locationMapping', 'for'];

  Object.keys(params).forEach(key => {
    if (!allowedFields.includes(key)) {
      delete params[key];
    }
  });

  const locationMapping = params.locationMapping;
  const locations = [];

  delete params.locationMapping;

  Object.keys(locationMapping).forEach(loc => {
    if (locationMapping[loc]) {
      locations.push(loc);
    }
  });

  if (!params._id) {
    params.cost = {
      monthly: params['cost.monthly'],
      hourly: params['cost.hourly'],
    };
    delete params['cost.monthly'];
    delete params['cost.hourly'];
    NetworkConfiguration.insert({ ...params, locations });
  } else {
    NetworkConfiguration.update(
      {
        _id: params._id,
      },
      {
        $set: {
          ...params,
          locations,
        },
      }
    );
  }

  return true;
};

Apis.deleteNetworkConfig = async config => {
  const user = Meteor.user();
  if (user.admin < 2) {
    throw new Meteor.Error('Unauthorized');
  }

  return NetworkConfiguration.update(
    { _id: config._id },
    {
      $set: {
        active: false,
      },
    }
  );
};

Apis.createPrivateHiveConfig = async ({ userId, params, type }) => {
  userId = userId || Meteor.userId();
  type = type || 'privatehive';

  params.for = type;

  const user = Meteor.users.find({ _id: userId }).fetch()[0];

  if (user.admin < 2) {
    throw new Meteor.Error('Unauthorized to create network config');
  }

  const allowedFields = [
    'cost.monthly',
    'cost.hourly',
    '_id',
    'name',
    'data',
    'for',
    'cpu',
    'ram',
    'disk',
    'kafka',
    'zookeeper',
    'ordererType',
    'isDiskChangeable',
    'showInNetworkSelection',
    'locationMapping',
    'category',
  ];

  Object.keys(params).forEach(key => {
    if (!allowedFields.includes(key)) {
      delete params[key];
    }
  });

  const locationMapping = params.locationMapping;
  const locations = [];

  delete params.locationMapping;

  Object.keys(locationMapping).forEach(loc => {
    if (locationMapping[loc]) {
      locations.push(loc);
    }
  });

  delete params.type;

  if (!params._id) {
    params.cost = {
      monthly: params['cost.monthly'],
      hourly: params['cost.hourly'],
    };
    delete params['cost.monthly'];
    delete params['cost.hourly'];
    NetworkConfiguration.insert({ ...params, locations });
  } else {
    NetworkConfiguration.update(
      {
        _id: params._id,
      },
      {
        $set: {
          ...params,
          locations,
        },
      }
    );
  }

  return true;
};

Meteor.methods({
  upsertNetworkConfig: Apis.createNetworkConfig,
  deleteNetworkConfig: Apis.deleteNetworkConfig,
  upsertPrivateHiveNetworkConfig: Apis.createPrivateHiveConfig,
});

export default Apis;
