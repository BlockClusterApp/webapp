import request from 'request-promise';

const Slack = {};

const urlMapping = {
  'new-support': 'https://hooks.slack.com/services/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',
  'support-customer-update': 'https://hooks.slack.com/services/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',
  'ticket-reopened': 'https://hooks.slack.com/services/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',
  'ticket-closed': 'https://hooks.slack.com/services/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',
  'refund-required': 'https://hooks.slack.com/services/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',
};

Slack.sendNotification = ({ type, message }) => {
  const curlEndOptions = {
    url: urlMapping[type],
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: `{"text": "${message}"}`,
  };

  if (process.env.NODE_ENV === 'production') {
    request(curlEndOptions);
  }
};

export default Slack;
