import {AssetTypes} from "../assetTypes.js"

Meteor.publish("assetTypes", function (instanceId) {
	return AssetTypes.find({instanceId: instanceId});
});
