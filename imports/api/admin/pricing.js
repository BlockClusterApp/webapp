import HyperionPricing from '../../collections/pricing/hyperion';
import PaymeterPricing from '../../collections/pricing/paymeter';
import { Meteor } from 'meteor/meteor';

const debug = require('debug')('api:admin:pricing');

const PricingApis = {};

const MIN_ADMIN_LEVEL = 2;

PricingApis.updateHyperionPricing = async options => {
  const user = Meteor.user();

  if (user.admin < 2) {
    throw new Meteor.Error(401, 'Unauthorized');
  }

  let { minimumMonthlyCost, perApiCost, perGBCost, perGBDataTransferCost } = options;

  minimumMonthlyCost = Number(minimumMonthlyCost);
  perApiCost = Number(perApiCost);
  perGBCost = Number(perGBCost);
  perGBDataTransferCost = Number(perGBDataTransferCost);

  if (isNaN(minimumMonthlyCost)) {
    throw new Meteor.Error(400, 'Minimum monthly cost is not a number');
  }

  if (isNaN(perApiCost)) {
    throw new Meteor.Error(400, 'Per API cost is not a number');
  }

  if (isNaN(perGBCost)) {
    throw new Meteor.Error(400, 'Per GB cost is not a number');
  }

  if (isNaN(perGBDataTransferCost)) {
    throw new Meteor.Error(400, 'Per GB Data transfer cost is not a number');
  }

  const old = HyperionPricing.find({ active: true }).fetch()[0];
  const oldEntry = { ...old };
  delete oldEntry._id;
  oldEntry.deletedBy = user._id;
  oldEntry.deletedAt = new Date();
  oldEntry.active = false;

  ElasticLogger.log('Hyperion pricing update', {
    user: user._id,
    userEmail: user.emails[0].address,
    previousPricing: old,
    newPricing: {
      minimumMonthlyCost,
      perApiCost,
      perGBCost,
      perGBDataTransferCost,
    },
  });

  const oldId = HyperionPricing.insert(oldEntry);

  const updateResult = HyperionPricing.upsert({ active: true }, { $set: { minimumMonthlyCost, perApiCost, perGBCost, perGBDataTransferCost, createdBy: user._id } });

  debug({ oldId, updateResult, message: 'Update hyperion price' });

  return true;
};

PricingApis.updatePaymeterPricing = async options => {
  const user = Meteor.user();

  if (user.admin < 2) {
    throw new Meteor.Error(401, 'Unauthorized');
  }

  let { minimumMonthlyCost, perApiCost, perWalletCost, perTransactionCost, perTransactionCostFlat } = options;

  minimumMonthlyCost = Number(minimumMonthlyCost);
  perApiCost = Number(perApiCost);
  perWalletCost = Number(perWalletCost);
  perTransactionCost = Number(perTransactionCost);
  perTransactionCostFlat = Number(perTransactionCostFlat);

  if (isNaN(minimumMonthlyCost)) {
    throw new Meteor.Error(400, 'Minimum monthly cost is not a number');
  }

  if (isNaN(perApiCost)) {
    throw new Meteor.Error(400, 'Per API cost is not a number');
  }

  if (isNaN(perWalletCost)) {
    throw new Meteor.Error(400, 'Per wallet cost is not a number');
  }

  if (isNaN(perTransactionCost)) {
    throw new Meteor.Error(400, 'Per txn cost is not a number');
  }

  if (isNaN(perTransactionCostFlat)) {
    throw new Meteor.Error(400, 'Per txn flat cost is not a number');
  }

  const old = PaymeterPricing.find({ active: true }).fetch()[0];
  const oldEntry = { ...old };
  delete oldEntry._id;
  oldEntry.deletedBy = user._id;
  oldEntry.deletedAt = new Date();
  oldEntry.active = false;

  ElasticLogger.log('Paymeter pricing update', {
    user: user._id,
    userEmail: user.emails[0].address,
    previousPricing: old,
    newPricing: {
      minimumMonthlyCost,
      perApiCost,
      perWalletCost,
      perTransactionCost,
      perTransactionCostFlat,
    },
  });

  const oldId = PaymeterPricing.insert(oldEntry);

  const updateResult = PaymeterPricing.upsert(
    { active: true },
    { $set: { minimumMonthlyCost, perApiCost, perWalletCost, perTransactionCost, perTransactionCostFlat, createdBy: user._id } }
  );

  debug({ oldId, updateResult, message: 'Update paymeter price' });

  return true;
};
Meteor.methods({
  updateHyperionPricing: PricingApis.updateHyperionPricing,
  updatePaymeterPricing: PricingApis.updatePaymeterPricing,
});

export default PricingApis;
