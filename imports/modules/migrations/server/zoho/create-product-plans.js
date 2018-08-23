import Zoho from '../../../../api/payments/zoho';
import { ZohoPlan, ZohoProduct } from '../../../../collections/zoho';
import Bluebird from 'bluebird';

const plans = [
  {
    name: 'verification',
    code: 'verification',
    description: 'Card verification',
    interval: 1,
    intervalUnit: 'months',
    price: 1
  },
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
  version: 10000000,
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

    await Bluebird.map(plans, async plan => {
      const planResult = Zoho.createPlan(plan, nodeProduct);
      if(!planResult) {
        console.log(`Error creating Plan ${plan.name} in zoho`);
        return false;
      }
      return true;
    });
  },
  down: function() {
    ZohoProduct.remove({});
    ZohoPlan.remove({});
  },
});
