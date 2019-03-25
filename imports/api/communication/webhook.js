import WebHook from '../../collections/webhooks';
import Bull from '../../modules/schedulers/bull';
import request from 'request-promise';
import uuid from 'uuid/v4';
import { Networks } from '../../collections/networks/networks';
import PrivateHive from '../../collections/privatehive';

const debug = require('debug')('api:communication:webhook');

const WebHookApis = {};

WebHookApis.generatePayload = data => {
  const { event } = data;
  const result = {
    timestamp: new Date().getTime(),
    event,
    keys: [],
    data: {},
  };
  delete data.event;

  if (data.networkId) {
    if (data.type === 'privatehive') {
      const network = PrivateHive.find({ instanceId: data.networkId }).fetch()[0];
      result.keys.push('network');
      result.data.network = {
        instanceId: network.instanceId,
        name: network.name,
        service: 'privatehive',
        type: network.isJoin ? 'peer' : 'orderer',
        locationCode: network.locationCode,
        configuration: network.networkConfig,
        status: network.status,
        properties: network.properties,
        nfsServer: network.nfs.url,
      };
    } else {
      const network = Networks.find({ instanceId: data.networkId }).fetch()[0];
      result.keys.push('network');
      result.data.network = {
        instanceId: network.instanceId,
        name: network.name,
        service: 'dynamo',
        type: network.peerType,
        locationCode: network.locationCode,
        configuration: {
          cpu: Number(network.networkConfig.cpu),
          memory: Number(network.networkConfig.ram),
          disk: Number(network.networkConfig.disk),
        },
        status: network.status,
        impulseStatus: network.impulseStatus,
      };
    }
    delete data.type;
    delete data.networkId;
  }

  if (data.userId) {
    const user = Meteor.users.find({ _id: data.userId }).fetch()[0];
    result.keys.push('user');
    result.data.user = {
      email: user.emails[0].address,
      name: `${user.profile.firstName} ${user.profile.lastName}`,
    };
    delete data.userId;
  }

  if (data.inviteId) {
    result.keys.push('invite');
    result.data.invite = {
      id: data.inviteId,
    };
    delete data.inviteId;
  }

  result.data = { ...result.data, ...data };

  debug('Webhook payload ', JSON.stringify(result));
  return result;
};

WebHookApis.queue = async ({ payload, userId, id, delay, type }) => {
  type = type || 'platform';
  let url;
  let retries = 0;
  if (id) {
    const hook = WebHook.find({ id }).fetch()[0];
    userId = hook.userId;
    url = hook.url;
    payload = hook.payload;
    retries = hook.retries + 1;
  }
  if (retries.length > 3) {
    ElasticLogger.log('Webhook Retries exhausted', {
      id,
      url,
      retries,
    });
  }
  const user = Meteor.users
    .find({
      _id: userId,
    })
    .fetch()[0];
  if (!user) {
    ElasticLogger.log('Invalid userid to send webhook');
    return;
  }

  if (!url) {
    if (type === 'platform') url = user.profile.notifyURL;
    else if (type === 'paymeter') url = url.profile.paymeterNotifyURL;
  }

  if (!url) {
    return;
  }

  id = id || uuid();
  WebHook.insert({
    id,
    url,
    payload,
    status: WebHook.StatusMapping.Pending,
    type,
    userId,
  });
  debug('Inserting to bull', id);
  Bull.addJob(
    'send-webhook',
    {
      id,
    },
    {
      delay,
    }
  );
  return;
};

WebHookApis.send = async ({ id }) => {
  const webhook = WebHook.find({ id }).fetch()[0];
  if (!webhook) {
    console.log('Sending webhook to null id', id);
    return true;
  }

  const { url, payload } = webhook;

  const reqOptions = {
    method: 'POST',
    uri: url,
    body: {
      data: payload,
    },
    resolveWithFullResponse: true,
    json: true,
    headers: {
      'content-type': 'application/json',
    },
    simple: false,
  };

  try {
    console.log('Sending');
    const response = await request(reqOptions);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      WebHook.update(
        {
          id,
        },
        {
          $set: {
            status: WebHook.StatusMapping.Sent,
            response: {
              code: response.statusCode,
            },
          },
        }
      );
      console.log('Response', response.statusCode);
      ElasticLogger.log('Webhook Successful', {
        url,
        responseCode: response.statusCode,
      });
    } else {
      WebHook.update(
        {
          id,
        },
        {
          $set: {
            status: WebHook.StatusMapping.Failed,
            response: {
              code: response.statusCode,
            },
          },
        }
      );
      WebHookApis.queue({
        id,
        delay: 60 * 60 * 1000,
      });
      ElasticLogger.log('Webhook Failed', {
        url,
        id,
        responseCode: response.statusCode,
      });
    }
  } catch (err) {
    ElasticLogger.log('Webhook error', {
      url,
      err,
    });
    WebHook.update(
      {
        id,
      },
      {
        $set: {
          status: WebHook.StatusMapping.Error,
        },
      }
    );

    return true;
  }
};

WebHookApis.testWebhook = async () => {
  const webhookId = WebHook.insert({
    id: uuid(),
    url: Meteor.user().profile.notifyURL,
    payload: {
      timestamp: new Date().getTime(),
      event: 'test-event',
      keys: ['event'],
      data: {
        event: {
          generatedBy: Meteor.user().emails[0].address,
          content: 'Hi there',
        },
      },
    },
    status: WebHook.StatusMapping.Pending,
    type: 'test-event',
    userId: Meteor.userId(),
  });
  console.log('Webhook id', webhookId);
  const webhook = WebHook.find({ _id: webhookId }).fetch()[0];
  await WebHookApis.send({ id: webhook.id });
  return true;
};

export default WebHookApis;

Meteor.methods({
  testWebhook: WebHookApis.testWebhook,
});
