#!/usr/bin/env bash

eval $(aws ecr get-login --no-include-email --region us-west-2)

docker pull 402432300121.dkr.ecr.us-west-2.amazonaws.com/blockcluster-daemon:latest
