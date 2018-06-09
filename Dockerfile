FROM ubuntu:16.04

RUN apt-get update && apt-get install -y --no-install-recommends apt-utils
RUN apt-get install -y locales && locale-gen en_US.UTF-8 && dpkg-reconfigure locales
ENV LANGUAGE=en_US.UTF-8 LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
RUN apt-get install -y --no-install-recommends vim less net-tools inetutils-ping wget curl git telnet nmap socat dnsutils netcat tree htop unzip sudo software-properties-common jq psmisc iproute python ssh rsync gettext-base

RUN wget -O - https://nodejs.org/dist/v8.11.0/node-v8.11.0-linux-x64.tar.gz | tar xz
RUN mv node* node
ENV PATH $PATH:/node/bin
RUN apt-get install -y build-essential
RUN curl /bin/sh -c curl https://install.meteor.com/ | sh

COPY . /blockcluster
RUN cd /blockcluster && npm --unsafe-perm install

WORKDIR /blockcluster
ENTRYPOINT ["/bin/bash", "-i", "-c"]
