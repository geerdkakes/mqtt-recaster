FROM node:8-slim

RUN apt-get update && \
    apt-get install -y jq

WORKDIR /usr/src/app

ADD server.js package.json start.sh /usr/src/app/

RUN cd /usr/src/app && \
    npm install

CMD [ "./start.sh" ]
