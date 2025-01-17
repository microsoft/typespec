# Contributing to TypeSpec Java Emitter Library

## Prerequisite

Install [Node.js](https://nodejs.org/) 20 or above. (Verify by running `node --version`)

Install [Java](https://docs.microsoft.com/java/openjdk/download) 17 or above. (Verify by running `java --version`)

Install [Maven](https://maven.apache.org/download.cgi). (Verify by running `mvn --version`)

## Build and Pack

["Setup.ps1" script](https://github.com/microsoft/typespec/blob/main/packages/http-client-java/Setup.ps1) builds TypeScript code and Java code, and packs them into "typespec-http-client-java-[version].tgz".

One can use npm to install the `@typespec/http-client-java` tgz locally.
```
npm install [path-to-typespec-http-client-java-tgz]
```

## End-to-end Tests

There is 2 end-to-end test modules:
- `packages/http-client-java/generator/http-client-generator-clientcore-test` for testing of unbranded code
- `packages/http-client-java/generator/http-client-generator-test` for testing of branded code

Their folder structure is identical. In the following sub-sections, the script or command should be invoked in one of the two folders.

### Set-up the environment

"Setup.ps1" script builds the emitter, and sets up the test environment.

### Generate the test code

If the feature or bug fix involves code change on generated code, you will need to re-generate the test code in one or both of the test modules.

"Generate.ps1" script (internally it calls "Setup.ps1" script as 1st step) generates the code for end-to-end testing.
The code is generated from TypeSpec source in [`@typespec/http-specs` package](https://www.npmjs.com/package/@typespec/http-specs).

### Run the end-to-end tests

1. Start the test server with `npm run spector-serve` (or `npm run spector-start` to start as a background process, `npm run spector-stop` to stop)
2. Run all the Java tests in the module

## Format Code

Before creating pull request, you are required to format the code.

Run `npm run format` in "packages/http-client-java" folder.
It formats TypeScript code as well as Java code.
