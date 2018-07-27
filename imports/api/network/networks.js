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

export default NetworkObj;
