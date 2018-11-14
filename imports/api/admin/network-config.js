import NetworkConfiguration from '../../collections/network-configuration/network-configuration';

const Apis = {};

Apis.createNetworkConfig = async ({userId, params}) => {
  userId = userId || Meteor.userId();

  const user = Meteor.users.find({_id: userId}).fetch()[0];

  if (user.admin < 2) {
    throw new Meteor.Error("Unauthorized to create network config");
  }

  const allowedFields = ['name', 'cpu', 'ram', 'disk', 'isDiskChangeable', "cost.monthly", "cost.hourly", "_id", "showInNetworkSelection"];

  Object.keys(params).forEach(key => {
    if(!allowedFields.includes(key)) {
      delete params[key];
    }
  });

  if (!params._id) {
    params.cost = {
      monthly: params["cost.monthly"],
      hourly: params["cost.hourly"]
    }
    delete params["cost.monthly"];
    delete params["cost.hourly"];
    NetworkConfiguration.insert(params);
  } else {
    NetworkConfiguration.update({
      _id: params._id
    }, {
      $set: {
        ...params
      }
    })
  }


  return true;
}

Apis.deleteNetworkConfig = async (config) => {
  const user = Meteor.user();
  if(user.admin < 2) {
    throw new Meteor.Error("Unauthorized");
  }

  return NetworkConfiguration.update({_id: config._id}, {
    $set: {
      active: false
    }
  });
}

Meteor.methods({
  upsertNetworkConfig: Apis.createNetworkConfig,
  deleteNetworkConfig: Apis.deleteNetworkConfig
});

export default Apis;
