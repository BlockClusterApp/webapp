import { Mongo } from "meteor/mongo";

//price of any token or coin is fetched from here
export const CoinPrices = new Mongo.Collection("coin_prices");
