# eXperience Indexing Agent for PERLS

This project implements an Experience Indexing Agent (XIA). This XIA takes source data that provides a JSON:API input and transforms it
into a P2881 JSON format.

## Development

This code is written in Typescript that is compiled into JS. A NodeJS Docker container is used to run the compiled program.

### Getting Started

`cp .env.example .env` # Copy .env.example to .env and edit Environment variables accordingly.

`npm install` # Install the proper dependencies.

`npm run debug_docker` # Build and start the docker container for debugging.

`npm run watch` # Watch the TypeScript files for changes and automatically re-compiles to JavaScript.

Using Visual Studio Code, you can run the launch configuration, "Launch Node Debugger", which watches for TS changes as well as listens to
node debugging (port 9229) to be able to stop on breakpoints. Then run the "Build Docker Node.js" to build and start the application.

## Production


