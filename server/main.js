require("../imports/startup/server/")
import {
    Networks
} from "../imports/collections/networks/networks.js"
import {
    Utilities
} from "../imports/collections/utilities/utilities.js"
import {
    SoloAssets
} from "../imports/collections/soloAssets/soloAssets.js"
import {
    StreamsItems
} from "../imports/collections/streamsItems/streamsItems.js"
import {
    Streams
} from "../imports/collections/streams/streams.js"
import {
    AssetTypes
} from "../imports/collections/assetTypes/assetTypes.js"
import {
    Orders
} from "../imports/collections/orders/orders.js"
import {
    Secrets
} from "../imports/collections/secrets/secrets.js"
import {
    AcceptedOrders
} from "../imports/collections/acceptedOrders/acceptedOrders.js"
import {
    BCAccounts
} from "../imports/collections/bcAccounts/bcAccounts.js"

import Helper from './helpers'
import HTTP from './helpers/promisified-http';

var Future = Npm.require("fibers/future");
var lightwallet = Npm.require("eth-lightwallet");
import Web3 from "web3";
var jsonminify = require("jsonminify");
import helpers from "../imports/modules/helpers"
import server_helpers from "../imports/modules/helpers/server"
import smartContracts from "../imports/modules/smart-contracts"
import {
    scanBlocksOfNode,
    authoritiesListCronJob
} from "../imports/collections/networks/server/cron.js"
var md5 = require("apache-md5");
var base64 = require('base-64');
var utf8 = require('utf8');
var BigNumber = require('bignumber.js');

const MeteorFunctions = require('./meteor-functions');

Accounts.validateLoginAttempt(function(options) {
    if (!options.allowed) {
        return false;
    }

    if (options.methodName == "createUser") {
        throw new Meteor.Error("unverified-account-created", "Account created but cannot be logged in until verified");
    }

    if (options.user.emails[0].verified === true) {
        return true;
    } else {
        throw new Meteor.Error("email-not-verified", "Your email is not approved by the administrator.");
    }
});

Accounts.onCreateUser(function(options, user) {
    user.firstLogin = false;
    user.profile = options.profile || {};

    // Assigns first and last names to the newly created user object
    user.profile.firstName = options.profile.firstName;
    user.profile.lastName = options.profile.lastName;
    return user;
});



Meteor.methods({
    ...MeteorFunctions
});


//     "unsubscribeStream": unsubscribeStream,
//     "subscribeAssetType": subscribeAssetType,
//     "unsubscribeAssetType": unsubscribeAssetType,
//     "updateAssetTypeCreatedNotifyURL": updateAssetTypeCreatedNotifyURL,
//     "downloadAccount": downloadAccount,
//     "createNetwork": meteorCreateNetwork,
//     "deleteNetwork": meteorDeleteNetwork,
//     "joinNetwork": meteorJoinNetwork,
//     "vote": meteorVote,
//     "unVote": meteorUnVote,
//     "createAccount": meteorCreateAccount,
//     "inviteUserToNetwork": inviteUserToNetwork,
//     "createAssetType": createAssetType,
//     "issueBulkAssets": issueBulkAssets,
//     "issueSoloAsset": issueSoloAsset,
//     "transferBulkAssets": transferBulkAssets,
//     "transferSoloAsset": transferSoloAsset,
//     "getBulkAssetBalance": getBulkAssetBalance,
//     "getSoloAssetInfo": getSoloAssetInfo,
//     "addUpdateSoloAssetInfo": addUpdateSoloAssetInfo,
//     "closeAsset": closeAsset,
//     "placeOrder": placeOrder,
//     "fullfillOrder": fullfillOrder,
//     "claimOrder": claimOrder,
//     "cancelOrder": cancelOrder,
//     "searchSoloAssets": searchSoloAssets,
//     "rpcPasswordUpdate": rpcPasswordUpdate,
//     "restAPIPasswordUpdate": restAPIPasswordUpdate,
//     "addPeer": addPeer,
//     "createStream": createStream,
//     "publishStream": publishStream,
//     "subscribeStream": subscribeStream,