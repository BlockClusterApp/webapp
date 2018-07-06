#!/usr/bin/env bash

. ./.circleci/export-env-vars.sh

aws s3 cp s3://bc-kubeconfig/config ~/.kube/config

helm init --client-only