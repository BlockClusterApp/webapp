# Blockcluster webapp
## Builds and Deployments
The repository uses circleci for CI/CD pipeline.
1. Pushing to ` dev ` brach will push the code to ` dev.blockcluster.io `
2. Pushing to ` staging ` branch will push the code to ` staging.blockcluster.io `
3. Pushing to ` master ` branch will push the code to ` app.blockcluster.io `

## Git usage guidelines
1. Don't rebase. Just merge
2. Any new feature you build should be on a separate branch. Eg say ` feature-1 `
3. To deploy to dev, create pull request on the ` feature-1 ` branch to merge to ` dev ` branch and then merge it.
4. To deploy to staging, create pull request on the ` feature-1 ` branch to merge to ` staging ` branch and then merge it.
5. To deploy to production, create pull request on the ` feature-1 ` branch to merge to ` master ` branch and then merge it.
6. Do NOT merge ` dev ` branch to ` staging ` or ` staging ` branch to ` master `. Always merge your feature branches to the respective base branches.

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
