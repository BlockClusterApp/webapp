import { Networks } from '../../collections/networks/networks';
import {UserInvitation} from '../../collections/user-invitation';
import Config from '../../modules/config/server';
import BullSystem from '../../modules/bull';

const NetworkObj = {};

NetworkObj.cleanNetworkDependencies = async (instanceId) => {
  const network = Networks.find({instanceId}).fetch()[0];

  if(!network) {
    return false;
  }
  const invites = UserInvitation.update({
    networkId: network._id
  }, {
    $set: {
      invitationStatus: UserInvitation.StatusMapping.InvitingNetworkDeleted
    }
  });
}

NetworkObj.getNodeCount = async () => {
  const networks = Networks.find({
    user: Meteor.userId(),
    active: true,
  }).fetch();

  const count = {
    total: 0,
    micro: 0
  };
  networks.forEach(network => {
    count.total+=1;
    if(network.networkConfig.cpu === 500) {
      count.micro += 1
    }
  });

  return count;
}

NetworkObj.updateContainerImages = async function(req, res, next) {
  if(!(req.headers && req.headers.authorization && req.headers.authorization === `${Config.NetworkUpdate.id}:${Config.NetworkUpdate.key}`)) {
    console.log("Network update request unauthorized ", req.headers && req.headers.authorization, `${Config.NetworkUpdate.id}:${Config.NetworkUpdate.key}`);
    return new Meteor.Error("Unauthorized");
  }
  const container = req.body.containerName;
  const imageTag = req.body.imageTag;

  BullSystem.addJob('start-repull-images', {
    container,
    imageTag
  });

  res.end("Ok");
}

JsonRoutes.add("post", "/api/networks/update-container-images", NetworkObj.updateContainerImages);

Meteor.methods({
  nodeCount: NetworkObj.getNodeCount
});

export default NetworkObj;
