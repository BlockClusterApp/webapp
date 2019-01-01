import { Mongo } from 'meteor/mongo';

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const HyperionBillHistory = new Mongo.Collection('hyperionBillHistory');

AttachBaseHooks(HyperionBillHistory);

export default HyperionBillHistory;
