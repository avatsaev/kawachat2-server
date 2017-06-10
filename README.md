# KawaChat 2 Server

Client available here: https://github.com/avatsaev/kawachat2-client

## Install

`$ npm install`

or if you're using yarn 

`$ yarn`

## Build 

Server is written in TypeScript 2, so you'll need to transpile it:

`$ gulp scripts`


## Run

The server synchronises socket sessions throught a redis server for eventual horizontal scaling, so you'll need to run one locally or in a docker container.

`$ docker pull redis:3.2-alpine`

`$ docker run -d -p 6379:6379 redis:3.2-alpine`

`$ npm start`
