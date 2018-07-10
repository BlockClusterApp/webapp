import { Mongo } from 'meteor/mongo';

class BaseMongoCollection extends Mongo.Collection {
  insert(object, callback) {
    object.createdAt = new Date();
    object.updatedAt = new Data();
    object.active = true;
    return super.insert(object, callback);
  }
  update(selector, object, options, callback){
    if(!object.$set){
      object.$set = {};
    }
    object.$set = {
      updatedAt: new Date()
    }

    return super.update(selector, object, options, callback);
  }
}

export default BaseMongoCollection;