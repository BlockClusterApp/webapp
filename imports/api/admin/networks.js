import { Networks } from '../../collections/networks/networks';
import Voucher from '../../collections/vouchers/voucher';
import LocationApi from '../locations';
import NetworkConfig from '../../collections/network-configuration/network-configuration';
import Config from '../../modules/config/server'
import moment from 'moment';

const Network = {};

const SUPER_ADMIN_LEVEL = 2;

Network.fetchNetworkForAdmin = async (networkId) => {
  if(Meteor.user().admin <= 0) {
    return new Meteor.Error("Unauthorized");
  }

  let network = Networks.find({_id: networkId}).fetch()[0];
  if(!network) {
    network = Networks.find({instanceId: networkId}).fetch()[0];
    if(!network) {
      return { network }
    }
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
    if(Meteor.user().admin < SUPER_ADMIN_LEVEL) {
      return reject(new Meteor.Error("Unauthorized"));
    }
    const network = Networks.find({_id: id}).fetch()[0];
    if(!network){
      return {};
    }
    const URL = `${Config.kubeRestApiHost(network.locationCode)}/api/v1/namespaces/${Config.namespace}/pods?labelSelector=app%3Ddynamo-node-${network.instanceId}`;
    HTTP.get(URL, (err, res) => {
      if(err){
        RavenLogger.log(err);
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

Network.fetchServiceStatus = async (id) => {
  return new Promise((resolve, reject) => {
    if(Meteor.user().admin < SUPER_ADMIN_LEVEL) {
      return reject(new Meteor.Error("Unauthorized"));
    }
    const network = Networks.find({_id: id}).fetch()[0];
    if(!network){
      return {};
    }
    const URL = `${Config.kubeRestApiHost(network.locationCode)}/api/v1/namespaces/${Config.namespace}/services/${network.instanceId}`;
    HTTP.get(URL, (err, res) => {
      if(err){
        RavenLogger.log(err);
        return reject(new Meteor.Error("Error", err));
      }
      const service = JSON.parse(res.content);
      const result = {
        apiVersion: service.apiVersion,
        name: service.metadata.name,
        namespace: service.metadata.namespace,
        selfLink: service.metadata.selfLink,
        createdAt: moment(service.metadata.creationTimestamp).format('DD-MMM-YYYY HH:mm:SS'),
        ports: service.spec.ports,
        type: service.spec.type,
        clusterIP: service.spec.clusterIP,
      }
      resolve(result);
    });
  });
}


Network.fetchDeploymentStatus = async (id) => {
  return new Promise((resolve, reject) => {
    if(Meteor.user().admin < SUPER_ADMIN_LEVEL) {
      return reject(new Meteor.Error("Unauthorized"));
    }
    const network = Networks.find({_id: id}).fetch()[0];
    if(!network){
      return {};
    }
    const URL = `${Config.kubeRestApiHost(network.locationCode)}/apis/apps/v1beta2/namespaces/${Config.namespace}/deployments/${network.instanceId}`;
    HTTP.get(URL, (err, res) => {
      if(err){
        RavenLogger.log(err);
        return reject(new Meteor.Error("Error", err));
      }
      const deploy = JSON.parse(res.content);
      const result = {
        apiVersion: deploy.apiVersion,
        name: deploy.metadata.name,
        namespace: deploy.metadata.namespace,
        selfLink: deploy.metadata.selfLink,
        createdAt: moment(deploy.metadata.creationTimestamp).format('DD-MMM-YYYY HH:mm:SS'),
        strategy: deploy.spec.strategy,
        revisionHistoryLimit: deploy.spec.revisionHistoryLimit,
        status: deploy.status
      }
      resolve(result);
    });
  });
}

Network.fetchPVCStatus = async (id) => {
  return new Promise((resolve, reject) => {
    if(Meteor.user().admin < SUPER_ADMIN_LEVEL) {
      return reject(new Meteor.Error("Unauthorized"));
    }
    const network = Networks.find({_id: id}).fetch()[0];
    if(!network){
      return {};
    }
    const URL = `${Config.kubeRestApiHost(network.locationCode)}/api/v1/namespaces/${Config.namespace}/persistentvolumeclaims/${network.instanceId}-pvc`;
    HTTP.get(URL, (err, res) => {
      if(err){
        RavenLogger.log(err);
        return reject(new Meteor.Error("Error", err));
      }
      const pvc = JSON.parse(res.content);
      const result = {
        apiVersion: pvc.apiVersion,
        name: pvc.metadata.name,
        namespace: pvc.metadata.namespace,
        selfLink: pvc.metadata.selfLink,
        provisioner: pvc.metadata.annotations['volume.beta.kubernetes.io/storage-provisioner'],
        createdAt: moment(pvc.metadata.creationTimestamp).format('DD-MMM-YYYY HH:mm:SS'),
        spec: pvc.spec,
        status: pvc.status
      }
      resolve(result);
    });
  });
}


Network.fetchIngressStatus = async (id) => {
  return new Promise((resolve, reject) => {
    if(Meteor.user().admin < SUPER_ADMIN_LEVEL) {
      return reject(new Meteor.Error("Unauthorized"));
    }
    const network = Networks.find({_id: id}).fetch()[0];
    if(!network){
      return {};
    }
    const URL = `${Config.kubeRestApiHost(network.locationCode)}/apis/extensions/v1beta1/namespaces/${Config.namespace}/ingresses/ingress-${network.instanceId}`;
    HTTP.get(URL, (err, res) => {
      if(err){
        RavenLogger.log(err);
        return reject(new Meteor.Error("Error", err));
      }
      const ingress = JSON.parse(res.content);
      const result = {
        apiVersion: ingress.apiVersion,
        name: ingress.metadata.name,
        namespace: ingress.metadata.namespace,
        selfLink: ingress.metadata.selfLink,
        authSecret: ingress.metadata.annotations['nginx.ingress.kubernetes.io/auth-secret'],
        configuration: ingress.metadata.annotations['nginx.ingress.kubernetes.io/configuration-snippet'].replace(/\\n/g, "&#13;&#10;"),
        createdAt: moment(ingress.metadata.creationTimestamp).format('DD-MMM-YYYY HH:mm:SS'),
        rules: ingress.spec.rules,
        status: ingress.status
      }
      resolve(result);
    });
  });
}

Meteor.methods({
  fetchNetworkForAdmin: Network.fetchNetworkForAdmin,
  fetchPodStatus: Network.fetchPodStatus,
  fetchServiceStatus: Network.fetchServiceStatus,
  fetchDeploymentStatus: Network.fetchDeploymentStatus,
  fetchPVCStatus: Network.fetchPVCStatus,
  fetchIngressStatus: Network.fetchIngressStatus
});

export default Network;
