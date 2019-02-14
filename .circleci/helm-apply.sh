#!/usr/bin/env bash

. ./.circleci/export-env-vars.sh

if [ "$NODE_ENV" = "production" ]; then
  aws s3 cp s3://bc-kubeconfig/config ~/.kube/config
  export KUBECONTEXT="k8s-${CLUSTER_PREFIX}.blockcluster.io";
else
  aws s3 cp s3://bc-kubeconfig/k8s-dev-do.blockcluster.io.yaml ~/.kube/config
  export KUBECONTEXT="do-lon1-do-dev-blockclusterio"
fi

helm init --client-only

setVariables="NODE_ENV=${NODE_ENV},image=${IMAGE_NAME},commitHash=${COMMIT_HASH},ROOT_URL=${ROOT_URL},NETWORK_UPDATE_ID=${NETWORK_UPDATE_ID},NETWORK_UPDATE_KEY=${NETWORK_UPDATE_KEY},COMMIT_HASH=${COMMIT_HASH},MONGO_URL=${MONGO_URL}"
releaseName="blockcluster-app-${NODE_ENV}"

echo $setVariables

helm --debug \
  --kube-context "$KUBECONTEXT" \
  upgrade \
  --install \
  --set ${setVariables} \
  --namespace ${NODE_ENV} \
  $releaseName \
  ./helm-chart

