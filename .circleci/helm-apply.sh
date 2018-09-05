#!/usr/bin/env bash

. ./.circleci/export-env-vars.sh

aws s3 cp s3://bc-kubeconfig/config ~/.kube/config

helm init --client-only

setVariables="NODE_ENV=${NODE_ENV},image=${IMAGE_NAME},commitHash=${COMMIT_HASH},ROOT_URL=${ROOT_URL},NETWORK_UPDATE_ID=${NETWORK_UPDATE_ID},NETWORK_UPDATE_KEY=${NETWORK_UPDATE_KEY},COMMIT_HASH=${COMMIT_HASH}"
releaseName="blockcluster-app-${NODE_ENV}"

echo $setVariables

helm --debug \
  --kube-context "k8s-${CLUSTER_PREFIX}.blockcluster.io" \
  upgrade \
  --install \
  --set ${setVariables} \
  --namespace ${NODE_ENV} \
  $releaseName \
  ./helm-chart

