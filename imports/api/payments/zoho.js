import { ZohoSubscription as ZohoApi } from '../../modules/server/zoho';
import { ZohoProduct, ZohoPlan, ZohoHostedPage } from '../../collections/zoho';
const debug = require('debug')('api:zoho');

const Zoho = {};

Zoho.createProduct = async productDetails => {
  if (!productDetails.identifier) {
    productDetails.identifier = productDetails.name
      .toLowerCase()
      .split(/\s/g)
      .join('-');
  }
  try {
    const count = ZohoProduct.find({identifier: productDetails.indentifier}).count();
    if(count > 0) {
      return ZohoProduct.find({identifier: productDetails.indentifier}).fetch()[0];
    }
    const productResponse = await ZohoApi.createProduct({
      name: productDetails.name,
      description: productDetails.description,
      emailsIds: ['zoho-admins@blockcluster.io', 'jibin.mathews@blockcluster.io'],
    });
    if (!productResponse.product) {
      debug('Product Creation | no product', productResponse);
      return false;
    }

    const productId = ZohoProduct.insert({ ...productResponse.product, identifier: productDetails.identifier });
    return ZohoProduct.find({ _id: productId }).fetch()[0];
  } catch (err) {
    debug('Product creation error ', err);
    return false;
  }
};

Zoho.createPlan = async (planDetails, zohoProduct) => {
  if (!zohoProduct) {
    throw new Meteor.Error('bad request', 'Cannot create plan without product');
  }

  try {
    const count = ZohoPlan.find({plan_code: planDetails.code}).count();
    if(count > 0) {
      return ZohoPlan.find({ plan_code: planDetails.code }).fetch()[0];
    }
    const planResponse = await ZohoApi.createPlan({
      plan: {
        name: planDetails.name,
        code: planDetails.code,
        description: planDetails.description,
        interval: planDetails.interval,
        intervalUnit: planDetails.intervalUnit,
        price: planDetails.price,
      },
      product: zohoProduct,
    });
    if (!planResponse.plan) {
      debug('Plan Creation | no plan', planResponse);
      return false;
    }

    const planId = ZohoPlan.insert({
      ...planResponse.plan,
    });
    return ZohoPlan.find({ _id: planId }).fetch();
  } catch (err) {
    debug('Plan creation error ', err);
    return false;
  }
};

Zoho.createCustomerFromUser = async userId => {
  const user = Meteor.users.find({ _id: userId }).fetch()[0];
  if (!user) {
    throw new Meteor.Error('bad-request', `Invalid user id ${userId}`);
  }
  try {
    const response = await ZohoSubscription.createCustomer({
      firstName: user.profile.firstName,
      currencyCode: 'USD',
      email: user.emails[0].address,
      id: user._id,
      lastName: user.profile.lastName,
    });
    if (!response.customer) {
      debug('Customer Creation | no customer', planResponse);
      return false;
    }
    Meteor.users.update(
      { _id: user._id },
      {
        $set: {
          zohoCustomerId: response.customer.customer_id,
          currencyCode: response.customer.currency_code,
        },
      }
    );
    return true;
  } catch (err) {
    debug('Customer creation error ', err);
    return false;
  }
};

Zoho.createHostedPage = async ({userId, plan, redirectUrl}) => {
  const user = Meteor.users.find({
    _id: userId
  }).fetch()[0];

  if(!user) {
    throw new Meteor.Error('bad-request', 'Invalid user id');
  }
  let zohoCustomerId = user.zohoCustomerId;
  if(!zohoCustomerId) {
    debug('Create hosted page | no zoho customer', userId);
    const result = await Zoho.createCustomerFromUser(userId);
    if(!result) {
      throw new Meteor.Error('internal-server', 'Error creating hosted page');
    }
    const user = Meteor.users.find({_id: userId}).fetch()[0];
    zohoCustomerId = user.zohoCustomerId;
  }

  try{
    const hostedPageResponse = await ZohoApi.createPaymentLink({
      zohoCustomerId,
      plan,
      customFields: [],
      redirectUrl
    });
    if(!hostedPageResponse.hostedpage) {
      debug('Hosted Page Creation | no customer', planResponse);
      return false;
    }

    const hostedPageId = ZohoHostedPage.insert({
      ...hostedPageResponse.hostedpage
    });

    return ZohoHostedPage.find({_id: hostedPageId}).fetch()[0];
  } catch(err) {
    debug('Hosted Page creation error ', err);
    return false;
  }

}

export default Zoho;
