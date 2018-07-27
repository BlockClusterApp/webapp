import { Mongo } from "meteor/mongo";

import AttachBaseHooks from '../../modules/helpers/model-helpers';

const UserCards = new Mongo.Collection("userCards");
AttachBaseHooks(UserCards);

UserCards.schema = new SimpleSchema({
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  userId: {
    type: String
  },
  cards: {
    type: Array
  },
  "cards.$": {
    type: Object
  }

});

export default UserCards;
