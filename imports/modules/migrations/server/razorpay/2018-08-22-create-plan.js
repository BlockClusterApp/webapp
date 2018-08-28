import RazorPay from '../../../../api/payments/payment-gateways/razorpay';
import Bluebird from 'bluebird';

const plans = [
  {
    plan: {
      item: {
        name: 'Verification',
        amount: 100,
        currency: 'INR',
      },
      interval: 1,
      period: 'monthly',
    },
    identifier: 'verification',
  },
];

Migrations.add({
  version: 8,
  up: async () => {
    await Bluebird.map(plans, async plan => {
      const rzPlan = await RazorPay.createPlan({...plan});
      console.log("Created razorpay plan", rzPlan);
    }, {
      concurrency: 10
    });
  },
  down: async () => {
    await Bluebird.map(plans, async plan => {
      const rzPlan = await RazorPay.deletePlan({identifier: plan.identifier});
      console.log("Created razorpay plan", rzPlan);
    }, {
      concurrency: 10
    });
  }
});
