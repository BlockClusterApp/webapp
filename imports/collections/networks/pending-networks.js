import { Mongo } from "meteor/mongo";
import AttachModelHooks from '../../modules/helpers/model-helpers';
import SimpleSchema from 'simpl-schema';

const PendingNetworkCollection = new Mongo.Collection("pendingNetworks");

AttachModelHooks(PendingNetworkCollection);

PendingNetworkCollection.Schema = new SimpleSchema({
  hostedPageId: {
    type: String
  },
  networkMetadata: {
    type: Object
  }
});

export default PendingNetworkCollection;
