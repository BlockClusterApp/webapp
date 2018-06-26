kubectl create secret tls blockcluster-ssl --key /tmp/tls.key --cert /tmp/tls.crt


docker run -p 8545:8545  -i -t  quorum /bin/bash
docker build -t quorum:latest .

docker rm -f $(docker ps -a -q)
docker rmi -f $(docker images -a -q)
