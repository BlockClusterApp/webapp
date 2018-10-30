#!/usr/bin/env bash

if [ -d ../licensing-microservice ];
then
  docker-compose up -f docker-compose.yml
  # folder exists
else
  docker-compose up -f docker-compose.licence-built.yml
  # Folder does not exist
fi
