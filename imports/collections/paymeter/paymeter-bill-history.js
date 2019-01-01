import { Mongo } from 'meteor/mongo';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const PaymeterBillHistory = new Mongo.Collection('paymeterBillHistory');

AttachBaseHooks(PaymeterBillHistory);

export default PaymeterBillHistory;
