import { Networks } from '../../collections/networks/networks';
import Voucher from '../../collections/vouchers/voucher';
import LocationApi from '../locations';
import NetworkConfig from '../../collections/network-configuration/network-configuration';
import Config from '../../modules/config/server'
import moment from 'moment';

const Network = {};

Network.fetchNetworkForAdmin = async (networkId) => {
  const network = Networks.find({_id: networkId}).fetch()[0];
  if(!network) {
    return {network};
  }
  const user = Meteor.users.find({_id: network.user}, {
    fields: {
      profile: 1,
      _id: 1,
      emails: 1,
      admin: 1,
      createdAt: 1
    }
  }).fetch()[0];
  const locations = LocationApi.getLocations();
  let voucher, networkType;
  if(network.voucherId) {
    voucher = Voucher.find({
      _id: network.voucherId
    }).fetch()[0];
  }


  if(network.metadata && network.metadata.networkConfig) {
    networkType = NetworkConfig.find({_id: network.metadata.networkConfig._id}).fetch()[0];
  }
  let bill;
  // if(user){
  //   bill = await Billing.generateBill(user._id);
  // }
  return {network, user, locations, voucher, networkType, bill: bill ? bill.networks.find(i => i._id === networkId) : null}
};

Network.fetchPodStatus =  (id) => {
  return new Promise((resolve, reject) => {
    const network = Networks.find({_id: id}).fetch()[0];
    if(!network){
      return {};
    }
    const URL = `${Config.kubeRestApiHost(network.locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3Ddynamo-node-${network.instanceId}`;
    HTTP.get(URL, (err, res) => {
      if(err){
        return reject(new Meteor.Error("Error", err));
      }
      const podList = JSON.parse(res.content);

      const result = {
        apiVersion: podList.apiVersion,
        pods: [

        ]
      };

      podList.items.forEach(pod => {
        const podDetails = {
          name: pod.metadata.name,
          namespace: pod.metadata.namespace,
          link: pod.metadata.selfLink,
          createdAt: moment(pod.metadata.creationTimestamp).format('DD-MMM-YYYY HH:mm:SS'),
          labels: {
            app: pod.metadata.labels.app
          },
          spec: {
            volumes: pod.spec.volumes,
            restartPolicy: pod.spec.restartPolicy,
            nodeName: pod.spec.nodeName,
            containers: [],
          },
          status: {
            phase: pod.status.phase,
            conditions: pod.status.conditions,
            hostIP: pod.status.hostIP,
            podIP: pod.status.podId,
            containerStatuses: []
          }
        };

        pod.spec.containers.forEach(container => {
          podDetails.spec.containers.push({
            name: container.name,
            image: container.image,
            resources: container.resources,
            imagePullPolicy: container.imagePullPolicy,
            env: container.env ? container.env.map(env => {
              if(env.name === "MONGO_URL"){
                return {
                  name: "MONGO_URL",
                  value: `xxxxxxxxxxxxxxxxxxxxxxxxxx${env.value.substring(75, 25)}xxxxxxxxxxx`
                }
              }
              return env;
            }) : [],
          });
        });

        pod.status.containerStatuses.forEach(containerStatus => {
          podDetails.status.containerStatuses.push({
            ready: containerStatus.ready,
            restartCount: containerStatus.restartCount,
            state: containerStatus.state,
            name: containerStatus.name,
            imageID: containerStatus.imageID
          })
        });
        result.pods.push(podDetails);
      });
      resolve(result);
    });
  });
}

Meteor.methods({
  fetchNetworkForAdmin: Network.fetchNetworkForAdmin,
  fetchPodStatus: Network.fetchPodStatus
});

export default Network;
