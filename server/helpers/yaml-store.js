


const CreateNetwork = {};

CreateNetwork.createQuoramAndScannerDeployment = (instanceId)=>({
    "apiVersion":"apps/v1beta1",
    "kind":"Deployment",
    "metadata":{
        "name": instanceId
    },
    "spec":{
        "replicas":1,
        "revisionHistoryLimit":10,
        "template":{
            "metadata":{
                "labels":{
                    "app":`quorum-node-${  instanceId}`
                }
            },
            "spec":{
                "containers":[
                    {
                        "name":"quorum",
                        "image":"402432300121.dkr.ecr.us-west-2.amazonaws.com/quorum",
                        "command":[
                            "bin/bash",
                            "-c",
                            "./setup.sh"
                        ],
                        "imagePullPolicy":"Always",
                        "ports":[
                            {
                                "containerPort":8545
                            },
                            {
                                "containerPort":23000
                            },
                            {
                                "containerPort":9001
                            },
                            {
                                "containerPort":6382
                            }
                        ]
                    },
                    {
                        "name":"scanner",
                        "image":"402432300121.dkr.ecr.us-west-2.amazonaws.com/scanner",
                        "env":[
                            {
                                "name": "instanceId",
                                "value": instanceId
                            }
                        ],
                        "imagePullPolicy":"Always"
                    }
                ],
                "imagePullSecrets":[
                    {
                        "name":"regsecret"
                    }
                ]
            }
        }
    }
});

CreateNetwork.createQuoramService = (instanceId) => ({
    "kind":"Service",
    "apiVersion":"v1",
    "metadata":{
        "name": instanceId
    },
    "spec":{
        "ports":[
            {
                "name":"rpc",
                "port":8545
            },
            {
                "name":"constellation",
                "port":9001
            },
            {
                "name":"eth",
                "port":23000
            },
            {
                "name":"utility",
                "port":6382
            }
        ],
        "selector":{
            "app":`quorum-node-${  instanceId}`
        },
        "type":"NodePort"
    }
});

export { CreateNetwork }