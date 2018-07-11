import { Mongo } from 'meteor/mongo';

class _BaseMongoCollection extends Mongo.Collection {

  constructor(collectionName) {
    super(collectionName);
  }
}

export default _BaseMongoCollection;
