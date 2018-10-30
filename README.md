# Blockcluster webapp
## Starting this app
* ` git clone git@github.com:BlockClusterApp/webapp.git `
* ` git submodule init `
* ` git submodule update `
* ` npm install `
* ` npm start `

## Builds and Deployments
The repository uses circleci for CI/CD pipeline.
1. Pushing to ` dev ` brach will push the code to ` dev.blockcluster.io `
2. Pushing to ` staging ` branch will push the code to ` staging.blockcluster.io `
3. Pushing to ` master ` branch will push the code to ` app.blockcluster.io `

## CI/CD Pipeline
[ONLY MASTER branch] Once a pull request is opened, everything is taken care by itself. If you want the PR to be automatically merged after all tests, then add the label ' Ready for merge ' to the PR.

Once a PR is created, CircleCI will run all the tests and the blockcluster bot will finally merge the PR. If some error occurs then the bot comments the error on the PR.

#### Note
You can manually trigger merge by commenting ` /merge ` irrespective of the base branch. Only this command will work on all branches.

## Git usage guidelines
1. Don't rebase. Just merge
2. Any new feature you build should be on a separate branch. Eg say ` feature-1 `
3. To deploy to dev, create pull request on the ` feature-1 ` branch to merge to ` dev ` branch and then merge it.
4. To deploy to staging, create pull request on the ` feature-1 ` branch to merge to ` staging ` branch and then merge it.
5. To deploy to production, create pull request on the ` feature-1 ` branch to merge to ` master ` branch and then merge it.
6. Do NOT merge ` dev ` branch to ` staging ` or ` staging ` branch to ` master `. Always merge your feature branches to the respective base branches.

## Agenda Dashboards
Here are the links to access the agenda dashboard:

Dev & Local:  `https://7oi0hnco3l.execute-api.ap-south-1.amazonaws.com/dev/dash?access_id=BlockCluster&access_key=JamesBond007`

Staging:  `https://h1w85m5208.execute-api.ap-south-1.amazonaws.com/staging/dash?access_id=BlockCluster&access_key=0c9d3170f6275a4d2`

Once you go to the URL, it might redirect you to ` hostname/dash?... `  instead of ` hostname/{env}/dash?... `. So just add the env in between. Basically double check the URL from above once redirected

## Certs
```
kubectl create secret tls blockcluster-ssl --key _.blockcluster.io_private_key.key --cert tls.cert

```

## Running dynamo
docker run -p 8545:8545  -i -t  quorum /bin/bash
docker build -t quorum:latest .

docker rm -f $(docker ps -a -q)
docker rmi -f $(docker images -a -q)


### Note
```
You can simply require() or import npm packages on client. Meteor will compile them to work with browser. It does what browserify, webpack and so on module loaders do. Some npm packages are not compatiable so convert them manually and put in packages.
```
