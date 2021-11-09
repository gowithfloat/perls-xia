FROM node:16.13.0-alpine as base
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "tsconfig.json", "./"]
COPY ["./src/", "./src"]
RUN npm install --${NODE_ENV}
RUN chown -R node /usr/src/app
USER node
RUN npm run build

FROM base as production
ENV NODE_PATH=./build
RUN rm -rf ./src tsconfig.json
CMD ["npm", "start"]
