import WebHook from '../../collections/webhooks';
import Bull from '../../modules/schedulers/bull';
import request from 'request-promise';
import uuid from 'uuid/v4';
import { Networks } from '../../collections/networks/networks';

const debug = require('debug')('api:communication:webhook');

const WebHookApis = {};

WebHookApis.generatePayload = (data) => {
  const { event } = data;
  const result = {
    timestamp: new Date().getTime(),
    event,
    keys: [],
    data: {}
  };

  if(data.networkId) {
    const network = Networks.find({instanceId: data.networkId}).fetch()[0];
    result.keys.push('network');
    result.data.network = {
      instanceId: network.instanceId,
      name: network.name,
      type: network.peerType,
      locationCode: network.locationCode,
      configuration: {
        cpu: Number(network.networkConfig.cpu),
        memory: Number(network.networkConfig.ram),
        disk: Number(network.networkConfig.disk),
      },
      status: network.status,
      impulseStatus: network.impulseStatus
    }
  }

  if (data.userId) {
    const user = Meteor.users.find({_id: data.userId}).fetch()[0];
    result.keys.push('user');
    result.data.user = {
      email: user.emails[0].address,
      name: `${user.profile.firstName} ${user.profile.lastName}`
    }
  }

  debug('Webhook payload ', JSON.stringify(result));
  return result;
}

WebHookApis.queue = async ({ payload, userId, id, delay }) => {
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
    url = user.profile.notifyURL;
  }

  id = id || uuid();
  WebHook.insert({
    id,
    url,
    payload,
    status: WebHook.StatusMapping.Pending,
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
};

WebHookApis.send = async ({ id }) => {
  const webhook = WebHook.find({ id }).fetch()[0];
  if (!webhook) {
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
  };

  try {
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
          response: {
            code: response.statusCode,
          },
        },
      }
    );

    return true;
  }
};

export default WebHookApis;
