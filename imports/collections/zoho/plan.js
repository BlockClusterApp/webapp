import { Mongo } from "meteor/mongo";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const ZohoPlan = new Mongo.Collection("zohoPlan");

AttachBaseHooks(ZohoPlan);

export default ZohoPlan;
