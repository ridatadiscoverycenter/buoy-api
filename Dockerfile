FROM node:16-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json .

RUN npm install
RUN yum install systemd
RUN sudo timedatectl set-timezone America/New_York

COPY . .

EXPOSE 8088

CMD ["npm", "start"]
