FROM node:8.9.3 as builder

RUN curl /bin/sh -c curl https://install.meteor.com/ | sh

WORKDIR /blockcluster
COPY . /blockcluster
RUN cd /blockcluster && npm --unsafe-perm install

RUN mkdir /meteor-output-tar
RUN meteor build /meteor-output-tar --architecture os.linux.x86_64 --allow-superuser
RUN mkdir /meteor-output
RUN tar -xzf /meteor-output-tar/blockcluster.tar.gz -C /meteor-output

FROM node:8.9.3 as base
RUN mkdir /blockcluster
WORKDIR /blockcluster
COPY --from=builder /meteor-output/bundle ./
RUN cd programs/server && npm install
ENV PORT=3000
CMD ["node", "main.js"]
