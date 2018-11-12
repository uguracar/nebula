FROM node:6.9.4
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
CMD node reviewProcessor.js