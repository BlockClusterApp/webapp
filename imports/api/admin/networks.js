import { Networks } from '../../collections/networks/networks';
import Voucher from '../../collections/vouchers/voucher';
import LocationApi from '../locations';
import NetworkConfig from '../../collections/network-configuration/network-configuration';
import PrivateHive from '../../collections/privatehive';
import Config from '../../modules/config/server';
import moment from 'moment';
import PrivateHiveApis from '../privatehive';

const Network = {};

const SUPER_ADMIN_LEVEL = 2;
const MIN_ADMIN_LEVEL = 2;

Network.fetchNetworkForAdmin = async networkId => {
  if (Meteor.user().admin <= 0) {
    return new Meteor.Error('Unauthorized');
  }

  let network = Networks.find({ _id: networkId }).fetch()[0];
  if (!network) {
    network = Networks.find({ instanceId: networkId }).fetch()[0];
    if (!network) {
      return { network };
    }
  }
  const user = Meteor.users
    .find(
      { _id: network.user },
      {
        fields: {
          profile: 1,
          _id: 1,
          emails: 1,
          admin: 1,
          createdAt: 1,
        },
      }
    )
    .fetch()[0];
  const locations = await LocationApi.getLocations({});
  let voucher, networkType;
  if (network.voucherId) {
    voucher = Voucher.find({
      _id: network.voucherId,
    }).fetch()[0];
  }

  if (network.metadata && network.metadata.networkConfig) {
    networkType = NetworkConfig.find({ _id: network.metadata.networkConfig._id, for: 'dynamo' }).fetch()[0];
  }
  let bill;
  // if(user){
  //   bill = await Billing.generateBill(user._id);
  // }
  return { network, user, locations, voucher, networkType, bill: bill ? bill.networks.find(i => i._id === networkId) : null };
};

Network.fetchPrivateHiveNetworkForAdmin = async networkId => {
  if (Meteor.user().admin <= 0) {
    return new Meteor.Error('Unauthorized');
  }

  let network = PrivateHive.find({ _id: networkId }).fetch()[0];
  if (!network) {
    network = PrivateHive.find({ instanceId: networkId }).fetch()[0];
    if (!network) {
      return { network };
    }
  }
  const user = Meteor.users
    .find(
      { _id: network.userId },
      {
        fields: {
          profile: 1,
          _id: 1,
          emails: 1,
          admin: 1,
          createdAt: 1,
        },
      }
    )
    .fetch()[0];
  const locations = await LocationApi.getLocations({ service: 'privatehive', userId: network.userId });
  let voucher, networkType;
  if (network.voucher) {
    voucher = Voucher.find({
      _id: network.voucher._id,
    }).fetch()[0];
  }

  if (network.networkConfig) {
    networkType = NetworkConfig.find({ _id: network.networkConfig._id, for: 'privatehive' }).fetch()[0];
  }
  return { network, user, locations, voucher, networkType };
};

Network.fetchPodStatus = ({ id, selector, namespace, type }) => {
  return new Promise((resolve, reject) => {
    if (Meteor.user().admin < SUPER_ADMIN_LEVEL) {
      return reject(new Meteor.Error('Unauthorized'));
    }
    let network;
    namespace = namespace || Config.namespace;
    type = type || 'network';
    if (type === 'privatehive') {
      network = PrivateHive.find({ _id: id }).fetch()[0];
    } else {
      network = Networks.find({ _id: id }).fetch()[0];
    }
    if (!network) {
      return {};
    }
    const URL = `${Config.kubeRestApiHost(network.locationCode)}/api/v1/namespaces/${namespace}/pods?${selector}`;
    HTTP.get(URL, (err, res) => {
      if (err) {
        RavenLogger.log(err);
        return reject(new Meteor.Error('Error', err));
      }
      const podList = JSON.parse(res.content);

      const result = {
        apiVersion: podList.apiVersion,
        pods: [],
      };

      podList.items.forEach(pod => {
        const podDetails = {
          name: pod.metadata.name,
          namespace: pod.metadata.namespace,
          link: pod.metadata.selfLink,
          createdAt: moment(pod.metadata.creationTimestamp).format('DD-MMM-YYYY kk:mm:ss'),
          labels: {
            app: pod.metadata.labels.app,
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
            containerStatuses: [],
          },
        };

        pod.spec.containers.forEach(container => {
          podDetails.spec.containers.push({
            name: container.name,
            image: container.image,
            resources: container.resources,
            imagePullPolicy: container.imagePullPolicy,
            env: container.env
              ? container.env.map(env => {
                  if (env.name === 'MONGO_URL') {
                    return {
                      name: 'MONGO_URL',
                      value: `xxxxxxxxxxxxxxxxxxxxxxxxxx${env.value.substring(75, 25)}xxxxxxxxxxx`,
                    };
                  }
                  return env;
                })
              : [],
          });
        });

        pod.status.containerStatuses.forEach(containerStatus => {
          podDetails.status.containerStatuses.push({
            ready: containerStatus.ready,
            restartCount: containerStatus.restartCount,
            state: containerStatus.state,
            name: containerStatus.name,
            imageID: containerStatus.imageID,
          });
        });
        result.pods.push(podDetails);
      });
      resolve(result);
    });
  });
};

Network.fetchServiceStatus = async ({ id, namespace, type, selector }) => {
  return new Promise((resolve, reject) => {
    if (Meteor.user().admin < SUPER_ADMIN_LEVEL) {
      return reject(new Meteor.Error('Unauthorized'));
    }
    type = type || 'network';
    if (type === 'privatehive') {
      network = PrivateHive.find({ _id: id }).fetch()[0];
    } else {
      network = Networks.find({ _id: id }).fetch()[0];
    }
    if (!network) {
      return {};
    }
    namespace = namespace || Config.namespace;
    let URL = `${Config.kubeRestApiHost(network.locationCode)}/api/v1/namespaces/${namespace}/services/${network.instanceId}`;
    if (selector) {
      URL = `${Config.kubeRestApiHost(network.locationCode)}/api/v1/namespaces/${namespace}/services?${selector}`;
    }

    HTTP.get(URL, (err, res) => {
      if (err) {
        RavenLogger.log(err);
        return reject(new Meteor.Error('Error', err));
      }
      const service = JSON.parse(res.content);
      let result;
      if (!selector) {
        result = {
          apiVersion: service.apiVersion,
          name: service.metadata.name,
          namespace: service.metadata.namespace,
          selfLink: service.metadata.selfLink,
          createdAt: moment(service.metadata.creationTimestamp).format('DD-MMM-YYYY kk:mm:ss'),
          ports: service.spec.ports,
          type: service.spec.type,
          clusterIP: service.spec.clusterIP,
        };
      } else {
        result = [];
        service.items.forEach(_service => {
          const d = {
            apiVersion: service.apiVersion,
            name: _service.metadata.name,
            namespace: _service.metadata.namespace,
            selfLink: _service.metadata.selfLink,
            createdAt: moment(_service.metadata.creationTimestamp).format('DD-MMM-YYYY kk:mm:ss'),
            ports: _service.spec.ports,
            type: _service.spec.type,
            clusterIP: _service.spec.clusterIP,
          };
          if (_service.spec.type === 'LoadBalancer') {
            d.cname = _service.status.loadBalancer.ingress[0].hostname;
          }
          result.push(d);
        });
      }

      resolve(result);
    });
  });
};

Network.fetchDeploymentStatus = async ({ id, namespace, type, selector }) => {
  return new Promise((resolve, reject) => {
    if (Meteor.user().admin < SUPER_ADMIN_LEVEL) {
      return reject(new Meteor.Error('Unauthorized'));
    }
    namespace = namespace || Config.namespace;
    type = type || 'network';
    if (type === 'privatehive') {
      network = PrivateHive.find({ _id: id }).fetch()[0];
    } else {
      network = Networks.find({ _id: id }).fetch()[0];
    }
    if (!network) {
      return {};
    }

    let URL = `${Config.kubeRestApiHost(network.locationCode)}/apis/apps/v1beta2/namespaces/${namespace}/deployments/${network.instanceId}`;
    if (selector) {
      URL = `${Config.kubeRestApiHost(network.locationCode)}/apis/apps/v1beta2/namespaces/${namespace}/deployments?${selector}`;
    }

    HTTP.get(URL, (err, res) => {
      if (err) {
        RavenLogger.log(err);
        return reject(new Meteor.Error('Error', err));
      }
      const deploy = JSON.parse(res.content);
      let result;
      if (deploy.kind === 'Deployment') {
        result = {
          apiVersion: deploy.apiVersion,
          name: deploy.metadata.name,
          namespace: deploy.metadata.namespace,
          selfLink: deploy.metadata.selfLink,
          createdAt: moment(deploy.metadata.creationTimestamp).format('DD-MMM-YYYY kk:mm:ss'),
          strategy: deploy.spec.strategy,
          revisionHistoryLimit: deploy.spec.revisionHistoryLimit,
          status: deploy.status,
        };
      } else {
        result = [];
        deploy.items.forEach(_deploy => {
          const d = {
            apiVersion: deploy.apiVersion,
            name: _deploy.metadata.name,
            namespace: _deploy.metadata.namespace,
            selfLink: _deploy.metadata.selfLink,
            createdAt: moment(_deploy.metadata.creationTimestamp).format('DD-MMM-YYYY kk:mm:ss'),
            strategy: _deploy.spec.strategy,
            revisionHistoryLimit: _deploy.spec.revisionHistoryLimit,
            status: _deploy.status,
          };
          result.push(d);
        });
      }

      resolve(result);
    });
  });
};

Network.fetchPVCStatus = async ({ id, namespace, type, selector }) => {
  return new Promise((resolve, reject) => {
    if (Meteor.user().admin < SUPER_ADMIN_LEVEL) {
      return reject(new Meteor.Error('Unauthorized'));
    }
    namespace = namespace || Config.namespace;
    type = type || 'network';
    if (type === 'privatehive') {
      network = PrivateHive.find({ _id: id }).fetch()[0];
    } else {
      network = Networks.find({ _id: id }).fetch()[0];
    }
    if (!network) {
      return {};
    }

    let URL = `${Config.kubeRestApiHost(network.locationCode)}/api/v1/namespaces/${namespace}/persistentvolumeclaims/${network.instanceId}-pvc`;
    if (selector) {
      URL = `${Config.kubeRestApiHost(network.locationCode)}/api/v1/namespaces/${namespace}/persistentvolumeclaims?${selector}`;
    }
    HTTP.get(URL, (err, res) => {
      if (err) {
        RavenLogger.log(err);
        return reject(new Meteor.Error('Error', err));
      }
      const pvc = JSON.parse(res.content);
      let result;
      if (!selector) {
        result = {
          apiVersion: pvc.apiVersion,
          name: pvc.metadata.name,
          namespace: pvc.metadata.namespace,
          selfLink: pvc.metadata.selfLink,
          provisioner: pvc.metadata.annotations['volume.beta.kubernetes.io/storage-provisioner'],
          createdAt: moment(pvc.metadata.creationTimestamp).format('DD-MMM-YYYY kk:mm:ss'),
          spec: pvc.spec,
          status: pvc.status,
        };
      } else {
        result = [];
        pvc.items.forEach(_pvc => {
          const d = {
            apiVersion: pvc.apiVersion,
            name: _pvc.metadata.name,
            namespace: _pvc.metadata.namespace,
            selfLink: _pvc.metadata.selfLink,
            provisioner: _pvc.metadata.annotations['volume.beta.kubernetes.io/storage-provisioner'],
            createdAt: moment(_pvc.metadata.creationTimestamp).format('DD-MMM-YYYY kk:mm:ss'),
            spec: _pvc.spec,
            status: _pvc.status,
          };
          result.push(d);
        });
      }
      return resolve(result);
    });
  });
};

Network.fetchIngressStatus = async ({ id, namespace, type, selector }) => {
  return new Promise((resolve, reject) => {
    if (Meteor.user().admin < SUPER_ADMIN_LEVEL) {
      return reject(new Meteor.Error('Unauthorized'));
    }
    namespace = namespace || Config.namespace;
    type = type || 'network';
    if (type === 'privatehive') {
      network = PrivateHive.find({ _id: id }).fetch()[0];
    } else {
      network = Networks.find({ _id: id }).fetch()[0];
    }
    if (!network) {
      return {};
    }
    let URL = `${Config.kubeRestApiHost(network.locationCode)}/apis/extensions/v1beta1/namespaces/${namespace}/ingresses/ingress-${network.instanceId}`;
    if (selector) {
      URL = `${Config.kubeRestApiHost(network.locationCode)}/apis/extensions/v1beta1/namespaces/${namespace}/ingresses?${selector}`;
    }
    HTTP.get(URL, (err, res) => {
      if (err) {
        RavenLogger.log(err);
        return reject(new Meteor.Error('Error', err));
      }
      const ingress = JSON.parse(res.content);
      let result;
      if (!selector) {
        result = {
          apiVersion: ingress.apiVersion,
          name: ingress.metadata.name,
          namespace: ingress.metadata.namespace,
          selfLink: ingress.metadata.selfLink,
          authSecret: ingress.metadata.annotations['nginx.ingress.kubernetes.io/auth-secret'],
          configuration: ingress.metadata.annotations['nginx.ingress.kubernetes.io/configuration-snippet'].replace(/\\n/g, '&#13;&#10;'),
          createdAt: moment(ingress.metadata.creationTimestamp).format('DD-MMM-YYYY kk:mm:ss'),
          rules: ingress.spec.rules,
          status: ingress.status,
        };
      } else {
        result = [];
        ingress.items.forEach(_ingress => {
          const d = {
            apiVersion: ingress.apiVersion,
            name: _ingress.metadata.name,
            namespace: _ingress.metadata.namespace,
            selfLink: _ingress.metadata.selfLink,
            authSecret: _ingress.metadata.annotations['nginx.ingress.kubernetes.io/auth-secret'],
            configuration: _ingress.metadata.annotations['nginx.ingress.kubernetes.io/configuration-snippet'].replace(/\\n/g, '&#13;&#10;'),
            createdAt: moment(_ingress.metadata.creationTimestamp).format('DD-MMM-YYYY kk:mm:ss'),
            rules: _ingress.spec.rules,
            status: _ingress.status,
          };
          result.push(d);
        });
      }
      resolve(result);
    });
  });
};

Network.adminDeleteNetwork = instanceId => {
  return new Promise(resolve => {
    if (Meteor.user().admin < MIN_ADMIN_LEVEL) {
      throw new Meteor.Error('unauthorized', 'Unauthorized for this action');
    }
    ElasticLogger.log('Admin delete network', {
      instanceId,
      userId: Meteor.userId(),
    });
    Meteor.call('deleteNetwork', instanceId, (err, res) => {
      if (err) {
        RavenLogger.log(err);
        throw new Meteor.Error(err.error, err.reason);
      }
      return resolve(true);
    });
  });
};

Network.adminPrivatehiveDeleteNetwork = async id => {
  if (Meteor.user().admin < MIN_ADMIN_LEVEL) {
    throw new Meteor.Error('unauthorized', 'Unauthorized for this action');
  }
  ElasticLogger.log('Admin privatehive delete network', {
    id,
    userId: Meteor.userId(),
  });
  await PrivateHiveApis.deleteNetwork({ id, userId: Meteor.userId() });
};

Meteor.methods({
  fetchNetworkForAdmin: Network.fetchNetworkForAdmin,
  fetchPodStatus: Network.fetchPodStatus,
  fetchServiceStatus: Network.fetchServiceStatus,
  fetchDeploymentStatus: Network.fetchDeploymentStatus,
  fetchPVCStatus: Network.fetchPVCStatus,
  fetchIngressStatus: Network.fetchIngressStatus,
  fetchPrivateHiveNetworkForAdmin: Network.fetchPrivateHiveNetworkForAdmin,
  adminPrivateHiveDeleteNetwork: Network.adminPrivatehiveDeleteNetwork,
  adminDeleteNetwork: Network.adminDeleteNetwork,
});

export default Network;
