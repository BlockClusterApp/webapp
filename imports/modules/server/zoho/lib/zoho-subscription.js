import request from 'request-promise';
import moment from 'moment';

const debug = require('debug')('payments:zoho');

function getRedirectURL() {
  const param = `/app/payments/zoho/success`;
  if(process.env.NODE_ENV === 'development') {
    return `http://localhost:3000${param}`
  }
  if(process.env.NODE_ENV === 'production') {
    return `https://app.blockcluster.io${param}`;
  }
  return `https://${process.env.NODE_ENV}.blockcluster.io${param}`;
}

class ZohoSubscription {
  constructor({ authToken, organizationId, version }) {
    if (!authToken) {
      throw new Error('authToken is required in ZohoSubscription constructor');
    }
    if (!organizationId) {
      throw new Error('organizationId is required in ZohoSubscription constructor');
    }
    this.authToken = authToken;
    this.organizationId = organizationId;
    this.version = version || 'v1';
  }

  sendRequest = async ({ method, url, data }) => {
    try {
      const options = {
        method: method.toUpperCase(),
        uri: url,
        headers: {
          'Authorization': `Zoho-authtoken ${this.authToken}`,
          'X-com-zoho-subscriptions-organizationid': `${this.organizationId}`,
          'content-type': 'application/json'
        },
        json: true,
      };
      if (['post', 'put'].includes(method.toLowerCase())) {
        options.body = data;
      }
      debug('Zoho options %0', options);
      const response = await request(options);
      return response;
    } catch (err) {
      debug('Zoho error %O', err);
      if (err.StatusCodeError) {
        return err;
      }
      throw new Error(err);
    } finally {
      debug(`Sent request to ${method} ${url}`);
    }
  };

  // ----------------------   Customer Related  ----------------------
  createCustomer = async ({ firstName, lastName, email, currencyCode, id }) => {
    currencyCode = currencyCode || 'INR';
    const data = {
      display_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      email,
      currency_code: currencyCode,
      is_portal_enabled: false,
      custom_fields: [
        {
          label: 'id',
          value: id,
        },
      ],
    };
    return this.sendRequest({
      url: `https://subscriptions.zoho.com/api/${this.version}/customers`,
      method: 'post',
      data,
    });
  };

  getCustomer = async zohoCustomerId => {
    if (!customerId) {
      throw new Error('Cannot get customer without customerId');
    }
    return this.sendRequest({
      method: 'get',
      url: `https://subscriptions.zoho.com/api/${this.version}/customers/${zohoCustomerId}`,
    });
  };

  // ----------------------   Subscription Related  ----------------------
  createPaymentLink = async ({ zohoCustomerId, plan, customFields, redirectUrl }) => {
    if(!customFields) {
      customFields = [];
    }
    const data = {
      customer_id: String(zohoCustomerId),
      plan: {
        plan_code: plan.planCode,
        plan_description: plan.description,
        quantity: plan.quantity || '1',
        price: plan.price,
      },
      custom_fields: [...customFields],
      auto_collect: true,
      starts_at: moment().format('YYYY-MM-DD'),
      redirect_url: redirectUrl || getRedirectURL(),
    };

    if (['production'].includes(process.env.NODE_ENV)) {
      data.payment_gateways = [
        {
          payment_gateway: 'test_gateway',
        },
      ];
    } else {
      data.payment_gateways = [
        {
          payment_gateway: 'razorpay',
        },
      ];
    }

    return this.sendRequest({
      method: 'post',
      url: `https://subscriptions.zoho.com/api/${this.version}/hostedpages/newsubscription`,
      data,
    });
  };

  // ----------------------   Plan Related  ----------------------
  createPlan = async ({ plan, product }) => {
    const data = {
      name: plan.name,
      plan_code: plan.code,
      product_id: product.id,
      description: plan.description,
      interval: plan.interval || 1,
      interval_unit: plan.intervalUnit || 'months',
      recurring_price: plan.price,
      exclude_setup_fee: true
    };

    return this.sendRequest({
      method: 'post',
      url: `https://subscriptions.zoho.com/api/${this.version}/plans`,
      data,
    });
  };

  // ----------------------   Product Related  ----------------------
  createProduct = async ({ product }) => {
    const data = {
      name: product.name,
      description: product.description,
      email_ids: product.emailsIds.join(','),
      redirect_url: product.redirectURL || getRedirectURL(),
    };
    return this.sendRequest({
      method: 'post',
      url: `https://subscriptions.zoho.com/api/${this.version}/products`,
      data
    });
  };
}

export default ZohoSubscription;
