import { Networks } from '../../collections/networks/networks';
import {UserInvitation} from '../../collections/user-invitation';
import Config from '../../modules/config/server';
import BullSystem from '../../modules/schedulers/bull';

const NetworkObj = {};

const MIN_ADMIN_LEVEL = 2;
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

NetworkObj.restartPod = (instanceId) => {
  return new Promise(resolve => {
    const network = Networks.find({
      instanceId
    }).fetch()[0];
    if(!network) {
      throw new Meteor.Error("invalid network", "Invalid instance id");
    }
    if(Meteor.userId() !== network.user && Meteor.user().admin < MIN_ADMIN_LEVEL) {
      throw new Meteor.Error("unauthorized", "Unauthorized for this action");
    }
    HTTP.get(`${Config.kubeRestApiHost(network.locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3Ddynamo-node-${network.instanceId}`, (err, res) => {
      if(err){
        RavenLogger.log(err);
        throw new Meteor.Error(`Delete pod failed for ${network.instanceId} - ${JSON.stringify(err)}`);
      }
      const podList = JSON.parse(res.content);
      podList.items.forEach(pod => {
        if(!pod){
          return;
        }
        const name = pod.metadata.name;
        HTTP.call("DELETE", `${Config.kubeRestApiHost(network.locationCode)}/api/v1/namespaces/${Config.namespace}/pods/${name}`, function(error, response) {
          if(error) {
            RavenLogger.log(err);
            throw new Error(`Error deleting pod ${pod.name} - ${JSON.stringify(error)}`);
          }
          console.log("Deleted pod ", name);
        });
      });

      resolve(true);
    });
  });
}

NetworkObj.adminDeleteNetwork = (instanceId) => {
  return new Promise(resolve => {
    if(Meteor.user().admin < MIN_ADMIN_LEVEL) {
      throw new Meteor.Error("unauthorized", "Unauthorized for this action");
    }
    Meteor.call("deleteNetwork", instanceId, (err, res) => {
      if(err){
        RavenLogger.log(err);
        throw new Meteor.Error(err.error, err.reason);
      }
      return resolve(true);
    });
  });
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
  nodeCount: NetworkObj.getNodeCount,
  restartPod: NetworkObj.restartPod,
  adminDeleteNetwork: NetworkObj.adminDeleteNetwork
});

export default NetworkObj;
