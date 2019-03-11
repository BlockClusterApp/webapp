import { Mongo } from 'meteor/mongo';

const PrivatehiveNetworksCollection = new Mongo.Collection('privatehiveNetworks');

export const PrivatehiveNetworks = PrivatehiveNetworksCollection;
