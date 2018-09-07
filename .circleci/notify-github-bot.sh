#!/usr/bin/env bash

PR=${CIRCLE_PULL_REQUEST}

if [[ -z ${PR} ]]
then
  exit 0;
fi

ST=$(echo ${PR} | base64)

echo "https://rp7epz6kpg.execute-api.ap-south-1.amazonaws.com/production/pr/tests-passed?pr=${ST}";

curl -v "https://rp7epz6kpg.execute-api.ap-south-1.amazonaws.com/production/pr/tests-passed?pr=${ST}"; exit 0

exit 0;
