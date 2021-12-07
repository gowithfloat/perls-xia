# eXperience Indexing Agent for PERLS

This project implements an Experience Indexing Agent (XIA). This XIA takes source data that provides a JSON:API input and transforms it
into a P2881 JSON format.

## Getting Started

### Requirements

* Docker

This code is written in Typescript that is compiled into JS. A NodeJS Docker container is used to run the compiled program.

### Development

```(sh)
# Copy .env.example to .env and edit Environment variables accordingly.
cp .env.example .env

# Install the proper dependencies.
npm install

# Watch the TypeScript files for changes and automatically re-compiles to JavaScript.
npm run watch

# Build and start the docker container for debugging.
# Opens port 9229 of the container to debug the Node program
npm run debug_docker
```

#### Visual Studio Code

If you use Visual Studio Code, you can run the launch configuration, "Launch Node Debugger", which watches for TS changes as well as listens to
node debugging (port 9229) to be able to stop on breakpoints. Then run the "Build Docker Node.js" to build and start the application. If the dist directory
in the Docker container is mounted locally, you may have to compile/watch for the program to execute.

### Production

The production version is built to run in a standalone container.

```(sh)
# Copy .env.example to .env and edit Environment variables accordingly. Ensure the NODE_ENV is set to production.
cp .env.example .env

# To build and run the container
docker compose up -d --build
```

To run the container (assumes the container has already been built)

`docker compose up -d`

## How It Works

Based on the [edX XIA workfow](https://github.com/OpenLXP/openlxp-xia-edx), this agent accepts JSON:API and transforms into the P2881 JSON format.

* Extract: Downloads source data from a JSON:API datasource
* Validate: Validates the data against the JSON:API schema
* Transform: Maps the source data to a Learning Experience, these experiences are then added to a Learning Experience set
* Validate: Validates the final mapped data to the P2881 JSON schema
* Log: Outputs error and debug information
* Load: **Coming soon** Pushes the data to a XIS

## Environment Variables

### Build Environment Information

These are used to determine the build environment and how the information should be outputted.

* NODE_ENV - The NodeJS environment. The options are development or production. This also dictates how statements are outputted (console.log or stdout)
* CONSOLE_OUTPUT - The level of statements outputted. The options are verbose or error.

### Source Endpoint Information

The source endpoint assumes OAuth2 Client Credentials Authentication.

* SOURCE_HOST - The source hostname
* SOURCE_CLIENT_ID - The source OAuth2 client identifier
* SOURCE_CLIENT_SECRET - The source OAuth2 client secret
* SOURCE_ENDPOINT - The source endpoint that the supplies JSON:API to be mapped

## Tests

There are certain unit tests within the `test` directory. These are written in TypeScript using
[Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/) Frameworks. This project also supports
code coverage using [Istanbul](https://istanbul.js.org/).

To run the tests:

```(sh)
npm run test

# To run it manually
 ./node_modules/.bin/mocha -r ts-node/register test/**/*.spec.ts
```

To run the tests and print out code coverage:

```(sh)
npm run code-coverage
```
