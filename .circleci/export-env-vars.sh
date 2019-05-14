#!/usr/bin/env bash

export COMMIT_HASH=${CIRCLE_SHA1}

set -x;

if [ ! -z "$JENKINS_HOME" ];
then
  export CIRCLE_BRANCH="$BRANCH_NAME"
  export COMMIT_HASH="$GIT_COMMIT"
fi

if [ "$CIRCLE_TAG" = "production" ] || [ "$CIRCLE_BRANCH" = "master" ] || [ "$CIRCLE_BRANCH" = "hot-fix" ];
then
  export NODE_ENV=production
  export CLUSTER_PREFIX="production-ap-south-1b";
  export ROOT_URL="app.blockcluster.io";
  export API_HOST="enterprise-api.blockcluster.io";
  export MONGO_URL="${PROD_MONGO_URL}"
elif [ "$CIRCLE_TAG" = "staging" ] || [ "$CIRCLE_BRANCH"  = "staging" ];
then
  export NODE_ENV=staging
  export CLUSTER_PREFIX="dev";
  export ROOT_URL="staging.blockcluster.io";
  export API_HOST ="https://enterprise-api-staging.blockcluster.io";
  export MONGO_URL="${STAGING_MONGO_URL}"
elif [ "$CIRCLE_TAG" = "dev" ] ||  [ "$CIRCLE_BRANCH" = "dev" ];
then
  export NODE_ENV=dev
  export CLUSTER_PREFIX="dev";
  export ROOT_URL="dev.blockcluster.io";
  export API_HOST="https://enterprise-api-dev.blockcluster.io";
  export MONGO_URL="${DEV_MONGO_URL}"
else
  export NODE_ENV=test
  export CLUSTER_PREFIX="dev";
  export ROOT_URL="test.blockcluster.io";
  export API_HOST="https://enterprise-api-dev.blockcluster.io";
  export MONGO_URL="${DEV_MONGO_URL}"
fi




export IMAGE_NAME='402432300121.dkr.ecr.us-west-2.amazonaws.com/webapp'
export IMAGE_TAG="${NODE_ENV}-${COMMIT_HASH}"

. ./.circleci/check-duplicate-build.sh
