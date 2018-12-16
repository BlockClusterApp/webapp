import { Mongo } from "meteor/mongo";

//this will contain list of erc20 tokens used by users. a doc will have contract address for sure but symbol is optional depending on whether found or not in ethplorer api
//if symbol found then 0.15% otherwise $0.20 is charged
export const ERC20 = new Mongo.Collection("erc20");
