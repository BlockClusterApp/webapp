#!/usr/bin/env bash

if [ -d ../licensing-microservice ];
then
  docker-compose run start_dependencies
  docker-compose up
  # folder exists
else
  docker pull 402432300121.dkr.ecr.us-west-2.amazonaws.com/licensing-micro:dev
  docker-compose up -f docker-compose.licence-built.yml
  # Folder does not exist
fi
