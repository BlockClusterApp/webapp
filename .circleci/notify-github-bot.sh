#!/usr/bin/env bash

PR=${CIRCLE_PULL_REQUEST}
PRS=${CIRCLE_PULL_REQUESTS}

if [[ -z ${PRS} ]]
then
else
  STS=$(echo ${PRS} | base64)
  curl -v "https://rp7epz6kpg.execute-api.ap-south-1.amazonaws.com/production/pr/tests-passed?pr=${STS}"; exit 0
  exit 0;
fi

if [[ -z ${PR} ]]
then
  CST=$(echo ${CIRCLE_SHA1} | base64)
  curl -v "https://rp7epz6kpg.execute-api.ap-south-1.amazonaws.com/production/commit/tests-passed?sha=${CST}"; exit 0
  exit 0;
fi

ST=$(echo ${PR} | base64)

echo "https://rp7epz6kpg.execute-api.ap-south-1.amazonaws.com/production/pr/tests-passed?pr=${ST}";

curl -v "https://rp7epz6kpg.execute-api.ap-south-1.amazonaws.com/production/pr/tests-passed?pr=${ST}"; exit 0

exit 0;
