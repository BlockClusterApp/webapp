import NetworkConfiguration from '../../../collections/network-configuration/network-configuration';
const data = require('./data/network-config-initial');

Migrations.add({
  version: 2,
  up: function() {
    // data.forEach(config => {
    //   ElasticLogger.log("Creating network config ", {name: config.name, config});
    //   NetworkConfiguration.insert(config);
    // });
  },
  down: function(){
    // NetworkConfiguration.remove({});
  }
});
