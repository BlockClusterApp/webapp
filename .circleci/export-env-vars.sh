#!/usr/bin/env bash

export COMMIT_HASH=${CIRCLE_SHA1}
if [ "$CIRCLE_TAG" = "production" ];
then
  export NODE_ENV=production
  export CLUSTER_PREFIX="production";
  export API_HOST="app.blockcluster.io";
elif [ "$CIRCLE_TAG" = "staging" ];
then
  export NODE_ENV=staging
  export CLUSTER_PREFIX="dev";
  export API_HOST="app.blockcluster.io";
elif [ "$CIRCLE_TAG" = "test" ];
then
  export NODE_ENV=test
  export CLUSTER_PREFIX="dev";
  export API_HOST="test.blockcluster.io";
else
  export NODE_ENV=dev
  export CLUSTER_PREFIX="dev";
  export API_HOST="dev.blockcluster.io";
fi


export IMAGE_NAME='402432300121.dkr.ecr.us-west-2.amazonaws.com/webapp'
export IMAGE_TAG="${NODE_ENV}-${COMMIT_HASH}"
