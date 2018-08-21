import { Mongo } from "meteor/mongo";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const ZohoProuduct = new Mongo.Collection("zohoProduct");

AttachBaseHooks(ZohoProuduct);

export default ZohoProuduct;
