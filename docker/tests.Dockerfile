FROM node:8.9.3 as builder

RUN curl https://install.meteor.com/ | sh

WORKDIR /blockcluster
COPY . /blockcluster
RUN cd /blockcluster && npm --unsafe-perm install


