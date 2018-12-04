import NetworkConfiguration from '../../collections/network-configuration/network-configuration';

const NetworkConfig = {};

NetworkConfig.getConfigs = async function(){
  const configs = NetworkConfiguration.find({active: true, showInNetworkSelection: true});

  const result = {};
  configs.forEach(config => {
    result[config.name] = config;
  });

  return result;
}

Meteor.methods({
  getConfigs: NetworkConfig.getConfigs
});

export default NetworkConfig
