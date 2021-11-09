FROM node:16.13.0-alpine as build
WORKDIR /usr/src/app
COPY ["package.json", "tsconfig.json", "./"]
COPY ["./src/", "./src"]
RUN npm install -D

RUN npm run build

FROM node:16.13.0-alpine
ARG NODE_BUILD_ENV
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm ci --${NODE_BUILD_ENV}
COPY --from=build /usr/src/app/dist dist
RUN chown -R node:node /usr/src/app
USER node
EXPOSE 3000
