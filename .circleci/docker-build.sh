#!/usr/bin/env bash

docker build -f Dockerfile \
    -t ${IMAGE_NAME}:${IMAGE_TAG} \
    .