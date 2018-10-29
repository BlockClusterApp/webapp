FROM node:8.9.3 as builder

RUN curl /bin/sh -c curl https://install.meteor.com/ | sh

WORKDIR /blockcluster
COPY ./package.json ./package-lock.json /blockcluster/
RUN cd /blockcluster && npm install

# RUN meteor npm install --save babel-runtime ejs simpl-schema sendgrid agenda \
# bull razorpay request moment debug request-promise web3 redis-jwt bignumber.js \
# bluebird multer jsonminify apache-md5 base-64 utf8

CMD ["meteor", "--allow-superuser"]
