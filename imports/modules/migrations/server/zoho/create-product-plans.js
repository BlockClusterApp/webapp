import Zoho from '../../../../api/payments/zoho';

const plans = [
  {
    name: 'Light Nodes',
    code: 'light-node',
    description: 'Small nodes for testing and deveopment: 0.5vCPU, 1GB RAM, 5GB Disk',
    interval: 1,
    intervalUnit: 'months',
    price: 35
  },
  {
    name: 'Power Nodes',
    code: 'power-nodes',
    description: 'Production grade nodes: 2vCPU, 7.5GB RAM, 200GB Disk',
    interval: 1,
    intervalUnit: 'months',
    price: 199
  }
];

Migrations.add({
  version: 9,
  up: async function() {
    const nodeProduct = await Zoho.createProduct({
      name: 'Node',
      identifier: 'blockcluster-node',
      description: 'Blockchain nodes on blockcluster'
    });
    if(!nodeProduct) {
      console.log(`Error creating Node product in zoho`);
      return;
    }

  },
  down: function() {

  },
});
