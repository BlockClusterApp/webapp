#!/usr/bin/env bash

URL="https://hooks.slack.com/services/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"

if [ "$CIRCLE_TAG" = "production" ] || [ "$CIRCLE_BRANCH" = "master" ];
then
  curl -X POST $URL -H 'Content-type: application/json' --data """{
   \"text\":\"\` $CIRCLE_BRANCH \` deployment for \` $CIRCLE_PROJECT_REPONAME \` started by \` $CIRCLE_USERNAME \` - track progress here - https://circleci.com/workflow-run/$CIRCLE_WORKFLOW_ID \"
  }"""
fi
exit 0;

