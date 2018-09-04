if (!Meteor.isTest) {
  return;
}

import Invoice from '../../../collections/payments/invoice';

export default function createUsers() {
  Invoice.remove({});
}
