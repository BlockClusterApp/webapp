import NetworkConfig from '../../../collections/network-configuration/network-configuration.js';

Migrations.add({
  version: 11,
  up: async function() {
    NetworkConfig.update(
      {
        active: {
          $in: [true, false, null],
        },
      },
      {
        $set: {
          for: 'dynamo',
        },
      },
      {
        multi: true,
      }
    );
    return true;
  },
  down: function() {
    NetworkConfig.remove({
      for: {
        $ne: 'dynamo',
      },
    });
    NetworkConfig.update(
      {},
      {
        $unset: {
          for: '',
        },
      },
      {
        multi: true,
      }
    );
  },
});
