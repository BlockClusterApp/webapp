#!/usr/bin/env bash

export COMMIT_HASH=${CIRCLE_SHA1}
if [ "$CIRCLE_TAG" = "production" ] || [ "$CIRCLE_BRANCH" = "master" ];
then
  export NODE_ENV=production
  export CLUSTER_PREFIX="production-ap-south-1a";
  export ROOT_URL="beta.blockcluster.io";
elif [ "$CIRCLE_TAG" = "staging" ] || [ "$CIRCLE_BRANCH"  = "staging" ];
then
  export NODE_ENV=staging
  export CLUSTER_PREFIX="dev";
  export ROOT_URL="app.blockcluster.io";
elif [ "$CIRCLE_TAG" = "test" ] || [ "$CIRCLE_BRANCH" = "test" ];
then
  export NODE_ENV=test
  export CLUSTER_PREFIX="dev";
  export ROOT_URL="test.blockcluster.io";
elif [ "$CIRCLE_TAG" = "dev" ] ||  [ "$CIRCLE_BRANCH" = "dev" ];
then
  export NODE_ENV=dev
  export CLUSTER_PREFIX="dev";
  export ROOT_URL="dev.blockcluster.io";
fi


export IMAGE_NAME='402432300121.dkr.ecr.us-west-2.amazonaws.com/webapp'
export IMAGE_TAG="${NODE_ENV}-${COMMIT_HASH}"
