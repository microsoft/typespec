# TypeSpec Java Emitter Library

This is a TypeSpec library that will emit a Java SDK from TypeSpec.

## Prerequisite

Install [Node.js](https://nodejs.org/) 20 or above. (Verify by running `node --version`)

Install [Java](https://docs.microsoft.com/java/openjdk/download) 17 or above. (Verify by running `java --version`)

Install [Maven](https://maven.apache.org/download.cgi). (Verify by running `mvn --version`)

## Getting started

### Initialize TypeSpec Project

Follow the [TypeSpec Getting Started](https://typespec.io/docs/) documentation to initialize your TypeSpec project.

Ensure that `npx tsp compile .` runs correctly.

### Add Java Emitter http-client-java

Run the command `npm install @typespec/http-client-java`.

### Generate Java Client SDK

Run the command `npx tsp compile <path-to-typespec-file> --emit @typespec/http-client-java`

e.g.

```cmd
npx tsp compile main.tsp --emit @typespec/http-client-java
```
