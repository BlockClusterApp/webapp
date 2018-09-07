#!/usr/bin/env bash
. ./.circleci/export-env-vars.sh

docker build -f docker/Dockerfile \
    -t $IMAGE_NAME:$IMAGE_TAG \
    .
