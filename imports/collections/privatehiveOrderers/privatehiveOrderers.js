import { Mongo } from 'meteor/mongo';

const PrivatehiveOrderersCollection = new Mongo.Collection('privatehiveOrderers');

export const PrivatehiveOrderers = PrivatehiveOrderersCollection;
