import HyperionPricing from '../hyperion';
import PaymeterPricing from '../paymeter';

Meteor.publish('pricing', () => {
  return [HyperionPricing.find({ active: true }), PaymeterPricing.find({ active: true })];
});
