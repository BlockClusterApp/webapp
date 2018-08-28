import { Mongo } from "meteor/mongo";

import AttachBaseHooks from "../../modules/helpers/model-helpers";

const ZohoHostedPage = new Mongo.Collection("zohoHostedPage");

AttachBaseHooks(ZohoHostedPage);

export default ZohoHostedPage;
