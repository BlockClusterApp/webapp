import NetworkConfiguration from '../../collections/network-configuration/network-configuration';

const NetworkConfig = {};

NetworkConfig.getConfigs = async function({ type, fetchRaw }) {
  const configs = NetworkConfiguration.find({ active: true, showInNetworkSelection: true, for: type }).fetch();

  if (fetchRaw) {
    return configs;
  }
  const result = {};
  configs.forEach(config => {
    result[config.name] = config;
  });

  return result;
};

Meteor.methods({
  getConfigs: NetworkConfig.getConfigs,
});

export default NetworkConfig;
