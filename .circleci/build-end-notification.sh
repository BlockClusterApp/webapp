#!/usr/bin/env bash

. ./.circleci/export-env-vars.sh

if [ "$CIRCLE_TAG" = "production" ] || [ "$CIRCLE_BRANCH" = "master" ];
then
  VERSION=$(date +"%d-%b-%Y %T")
  DATA="{\"version\": \"${COMMIT_HASH}\"}"
  curl https://sentry.io/api/hooks/release/builtin/1274301/329643f35065970b2cb199c8288711ddfec70bad68a9e25b1080860ebc848205/ \
    -X POST \
    -H 'Content-Type: application/json' \
    -d "${DATA}"

  curl https://sentry.io/api/hooks/release/builtin/1274848/683726c50dca0e147903caf91ab6447f592c8344947580ebd63af2ff0db26caa/ \
    -X POST \
    -H 'Content-Type: application/json' \
    -d "${DATA}"
fi


exit 0;
