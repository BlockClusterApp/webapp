import ZohoSubscriptionLib from './lib/zoho-subscription';
import Config from '../../config/server';

// Creating a singleton class
const ZohoSubscription = new ZohoSubscriptionLib({
  authToken: Config.Zoho.authToken,
  organizationId: Config.Zoho.organizationId,
  version: 'v1'
});

export {
  ZohoSubscription
};
