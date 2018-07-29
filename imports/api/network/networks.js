import { Networks } from '../../collections/networks/networks';
import {UserInvitation} from '../../collections/user-invitation';

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

  console.log("Micro nodes", count);
  return count;
}

Meteor.methods({
  nodeCount: NetworkObj.getNodeCount
});

export default NetworkObj;
