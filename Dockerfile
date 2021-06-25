FROM node:16-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .

RUN npm install

COPY . .

EXPOSE 8088

CMD ["npm", "start"]
