#!/usr/bin/env bash

if [ "$CIRCLE_TAG" = "production" ];
then
  export NODE_ENV=production
  export CLUSTER_PREFIX="production";
elif [ "$CIRCLE_TAG" = "staging" ];
then
  export NODE_ENV=staging
  export CLUSTER_PREFIX="dev";
elif [ "$CIRCLE_TAG" = "test" ];
then
  export NODE_ENV=test
  export CLUSTER_PREFIX="dev";
else
  export NODE_ENV=dev
  export CLUSTER_PREFIX="dev";
fi


export IMAGE_NAME='402432300121.dkr.ecr.us-west-2.amazonaws.com/blockcluster-webapp'
export IMAGE_TAG="${NODE_ENV}-${COMMIT_HASH}"
