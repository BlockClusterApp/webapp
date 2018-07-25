import { Mongo } from "meteor/mongo";

export const EncryptionKeys = new Mongo.Collection("encryptionKeys");
