import { Networks } from "../../../collections/networks/networks";
import UserCards from "../../../collections/payments/user-cards";
import Bluebird from "bluebird";
import moment from "moment";

async function getNonVerifiedUsers() {
  const userCards = UserCards.find({ active: true }).fetch();
  const nonVerifiedUsers = Meteor.users.find({
    _id: {
      $nin: userCards.map(i => i.userId)
    }
  });
  return nonVerifiedUsers.map(i => i._id);
}

async function getToBeDeletedNetworks(userIds) {
  console.log("Non verified users", userIds);
  const networks = Networks.find({
    user: {
      $in: userIds
    },
    deletedAt: null,
    createdAt: {
      $lte: moment()
        .subtract(5, "days")
        .toDate()
    },
    active: true
  });

  return networks.map(i => i.instanceId);
}

async function deleteNetworks(instanceIds) {
  console.log("To be deleted network ids", instanceIds);
  await Bluebird.map(
    instanceIds,
    Meteor.bindEnvironment(instanceId => {
      return new Promise(
        Meteor.bindEnvironment(resolve => {
          Meteor.call("deleteNetwork", instanceId, (err, res) => {
            console.log(`Deleting ${instanceId} `, err, res);
            return resolve();
          });
        })
      );
    })
  );
  return true;
}

Migrations.add({
  version: 7,
  up: function() {
    // getNonVerifiedUsers()
    //   .then(Meteor.bindEnvironment(getToBeDeletedNetworks))
    //   .then(Meteor.bindEnvironment(deleteNetworks))
    //   .then(() => {
    //     console.log("FInished deleting networks");
    //   });
  },
  down: function() {
    console.log("Cannot undo network deletion");
  }
});
