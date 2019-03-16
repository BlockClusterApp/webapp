import { Mongo } from 'meteor/mongo';

const PrivatehivePeersCollection = new Mongo.Collection('privatehivePeers');

export const PrivatehivePeers = PrivatehivePeersCollection;
