if(!Meteor.isTest) {
  return false;
}

import createUser from './dummy-data/user';
import createForex from './dummy-data/forex';
import createNetwork from './dummy-data/network';
import createInvoice from './dummy-data/invoice';

export default function createData() {
  createUser();
  createForex();
  createNetwork();
  createInvoice();
}
