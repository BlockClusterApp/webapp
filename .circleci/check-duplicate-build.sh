#!/usr/bin/env bash

if [[ -z $CIRCLE_USERNAME ]];
then
  if [[ "${NODE_ENV}" = "staging" ]];
  then
    exit 0;
  elif [[ "${NODE_ENV}" = "dev" ]];
  then
    exit 0;
  elif [[ "${CIRCLE_BRANCH}" = "hot-fix" ]];
  then
    exit 0;
  fi
fi

