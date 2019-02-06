## Setting up a new cluster region

### Pre-requisites

- Working Kubernetes cluster
- MongoDB setup in such a way that nodes in the above cluster can access it
- Auth token for the above kubernetes cluster with following rbac roles:
  - Create and delete deployments, replicasets & pods
  - Create, delete and update ingress
  - Create and delete secrets
  - Create and delete PVs and PVCs
  - Create and delete cronjobs
  - Create and delete horizontal pod autoscaler
  - Fetch metrics of nodes, pods, cronjobs
  - [See Appendix for sample service account]
- An nginx, traefik or any other reverse proxy so that ingresses are exposed via this service [type: LoadBalancer]

## Adding new cluster to webapp

1. Get the blockcluster enterprise cli in your local machine
2. Make sure `kubectl` is installed in your system. Set the kube context to the cluster and namespace where your webapp is hosted. (`k8s-dev.blockcluster.io` and `dev`)
3. Update the previous `blockcluster.production.yaml` file with the new config.
   Example: add the following to `blockcluster.clusters` object

```yaml
- namespace: default
  master_api_host: <URL where kubernetes api server is exposed> (https://k8s-dev-us-west-2-api.blockcluster.io)
  worker_node_ip: <IP address or hostname where node can be reached> ('13.232.213.158')
  location_code: <Location code to be displayed in webapp> ('ap-south-1b')
  location_name: <Location name to be displayed in webapp> ('Asia Pacific South (Mumbai) - 1')
  dynamo_domain_name: <Domain name to which dynamo will reachable. Cannot be an IP as this is required by ingress> ('app-ap-south-1b.blockcluster.io')
  api_host: <Host name where webapp is accessible> ('https://app.blockcluster.io')
  auth:
    user: <username with the above rbac>
    pass: <password for the above user>
    # OR
    token: <auth token for the above rbac>
  hyperion:
    ipfs_port: <hyperion ipfs port if known or any random number> ('30602')
    ipfs_cluster_port: <hyperion pifs cluster port if known or any random number> ('32763')
```

> Hyperion ports will automatically be updated by the in-cluster agent so even if wrong port is given, it will be overwritten.

4. Apply the above modified config file by `blockcluster apply -f blockcluster.production.yaml`. The new location should be added to webapp within few minutes.

## Appendix

#### 1. Service Account for auth token

```yaml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: blockcluster-webapp
rules:
  - nonResourceURLs:
      - '/ping'
    verbs: ['get']
  - apiGroups: ['', 'metrics.k8s.io']
    resources:
      - 'nodes'
      - 'namespaces'
      - 'events'
    verbs: ['get', 'list', 'watch']
  - apiGroups: ['', 'metrics.k8s.io', 'batch']
    resources:
      - 'pods'
      - 'cronjobs'
    verbs: ['get', 'list', 'watch', 'delete', 'create', 'update']
  - apiGroups: ['', 'apps', 'extensions']
    resources:
      - 'deployments'
      - 'ingresses'
      - 'replicasets'
    verbs: ['get', 'delete', 'update', 'patch', 'list', 'watch', 'create']
  - apiGroups: ['']
    resources:
      - 'services'
      - 'horizontalpodautoscalers'
      - 'statefulsets'
      - 'persistentvolumeclaims'
      - 'ingresses'
    verbs: ['get', 'delete', 'update', 'patch', 'list', 'watch', 'create']
  - apiGroups: ['']
    resources:
      - 'secrets'
    verbs: ['delete', 'create', 'get']

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: blockcluster-webapp
  namespace: blockcluster
automountServiceAccountToken: true
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: blockcluster-webapp
  namespace: blockcluster
subjects:
  - kind: ServiceAccount
    name: blockcluster-webapp
    namespace: blockcluster
roleRef:
  kind: ClusterRole
  name: blockcluster-webapp
  apiGroup: rbac.authorization.k8s.io
```
