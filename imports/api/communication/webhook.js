import WebHook from '../../collections/webhooks';
import Bull from '../../modules/schedulers/bull';
import uuid from 'uuid/v4'

const WebHookApis = {};

WebHookApis.queue = async ({url, payload, userId}) => {
  const id = uuid();
  WebHook.insert({
    id,
    url,
    payload,
    status: WebHook.StatusMapping.Pending
  });
  Bull.addJob('send-webhook', {
    id,
    url,
    payload
  });
}

export default WebHookApis;
