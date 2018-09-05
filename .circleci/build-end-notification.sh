#!/usr/bin/env bash

. ./.circleci/export-env-vars.sh

VERSION=$(date +"%d-%b-%Y %T")
DATA="{\"version\": \"${COMMIT_HASH}\"}"

if [ "$CIRCLE_TAG" = "production" ] || [ "$CIRCLE_BRANCH" = "master" ];
then
 SERVER_URL="https://sentry.io/api/hooks/release/builtin/1274301/329643f35065970b2cb199c8288711ddfec70bad68a9e25b1080860ebc848205/"
 CLIENT_URL="https://sentry.io/api/hooks/release/builtin/1274848/683726c50dca0e147903caf91ab6447f592c8344947580ebd63af2ff0db26caa/"
elif [ "$CIRCLE_TAG" = "staging" ] || [ "$CIRCLE_BRANCH"  = "staging" ];
then
  SERVER_URL="https://sentry.io/api/hooks/release/builtin/1275118/cba3d299747162c479c0010e5a2e2d5a1d9790315545806da00bbdb5f45015bd/"
  CLIENT_URL="https://sentry.io/api/hooks/release/builtin/1275121/bcc9ced3406fad31b1b802c3d679185f1ea4345bfc825f9efde8fdd4c57e3d69/"
elif [ "$CIRCLE_TAG" = "dev" ] ||  [ "$CIRCLE_BRANCH" = "dev" ];
then
  SERVER_URL="https://sentry.io/api/hooks/release/builtin/1275120/3edcdc66bdf135751515a7d16700f04ef2ad2432e3a369a0eef61e1a891465bd/"
  CLIENT_URL="https://sentry.io/api/hooks/release/builtin/1275122/c3824ed34129e6aaf95d7a24ac6bfa32f93e966847c3db8dc6c72cf0f0477670/"
fi

curl $SERVER_URL \
  -X POST \
  -H 'Content-Type: application/json' \
  -d "${DATA}"

curl $CLIENT_URL \
  -X POST \
  -H 'Content-Type: application/json' \
  -d "${DATA}"

exit 0;
