import { Mongo } from "meteor/mongo";

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const Forex = new Mongo.Collection("forex");
AttachBaseHooks(Forex);

Forex.schema = new SimpleSchema({
  inr: {
    type: Number
  },
  usd: {
    type: Number
  },
  eur: {
    type: Number
  }
});

export default Forex;
