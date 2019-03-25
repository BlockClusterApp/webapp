import { Mongo } from 'meteor/mongo';
import AttachBaseHooks from '../../modules/helpers/model-helpers';

const PrivatehiveOrderersCollection = new Mongo.Collection('privatehiveOrderers');

AttachBaseHooks(PrivatehiveOrderersCollection);

export const PrivatehiveOrderers = PrivatehiveOrderersCollection;
