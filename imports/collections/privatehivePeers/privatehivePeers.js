import { Mongo } from 'meteor/mongo';
import AttachBaseHooks from '../../modules/helpers/model-helpers';

const PrivatehivePeersCollection = new Mongo.Collection('privatehivePeers');
AttachBaseHooks(PrivatehivePeersCollection);

export const PrivatehivePeers = PrivatehivePeersCollection;
