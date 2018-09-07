FROM node:8.9.3 as builder

RUN  curl https://install.meteor.com/ | sh

WORKDIR /blockcluster
COPY . /blockcluster
RUN cd /blockcluster && npm --unsafe-perm install

RUN mkdir /meteor-output-tar
RUN meteor build /meteor-output-tar --architecture os.linux.x86_64 --allow-superuser
RUN mkdir /meteor-output
RUN tar -xzf /meteor-output-tar/blockcluster.tar.gz -C /meteor-output

FROM node:8.9.3
RUN mkdir /blockcluster
WORKDIR /blockcluster
COPY --from=builder /meteor-output/bundle ./
# Not alpine as it might need other ubuntu dependencies
RUN cd programs/server && npm install

# FROM node:8.9.3-alpine as base
# RUN mkdir /blockcluster
# WORKDIR /blockcluster
# # Minimal build
# COPY --from=support /blockcluster ./

ENV PORT=3000
CMD ["node", "main.js"]
