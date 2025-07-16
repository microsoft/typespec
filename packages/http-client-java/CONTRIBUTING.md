# Contributing to TypeSpec Java Emitter Library

## Prerequisite

Install [Node.js](https://nodejs.org/) 20 or above. (Verify by running `node --version`)

Install [Java](https://docs.microsoft.com/java/openjdk/download) 17 or above. (Verify by running `java --version`)

Install [Maven](https://maven.apache.org/download.cgi). (Verify by running `mvn --version`)

## Project Structure

The TypeSpec Java Emitter Library is a Node.js package.
It publishes to [npm `@typespec/http-client-java`](https://www.npmjs.com/package/@typespec/http-client-java).

As a Node.js package, the entry of the library is written in TypeScript, under `emitter` folder.

As a Java code generator, part of the implementation is written in Java, under `generator` folder.
Java code is packaged into a JAR file, and included in the Node.js package. The JAR file is called at runtime by TypeScript code.

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

["Setup.ps1" script in test module](https://github.com/microsoft/typespec/blob/main/packages/http-client-java/generator/http-client-generator-clientcore-test/Setup.ps1) builds the emitter, and sets up the test environment.

Internally, it does

1. Build the `@typespec/http-client-java` tgz locally. See [Build and Pack](#build-and-pack).
2. Re-install the tgz (along with other dependencies) in the test module.

### Debug emitter's `.ts` code

1. In vscode, toggle `Auto Attach` as `Always` (click `ctrl+shift+p` and input `Toggle Auto Attach`, choose the option `Always`). You may need to restart vscode after setting.

2. Run below commands to link packages/http-client-java/http-client-generator-test to packages/http-client-java, so that you can debug emitter's .ts code directly.

```
$ cd packages/http-client-java
$ npm link
$ cd packages/http-client-java/generator/http-client-generator-test
$ npm link ../../
```

3. After changing emitter's code, run `npm run build:emitter`.

4. When running `tsp compile` on test cases under `http-client-generator-test`, it will go to the break point you set in `.ts`(e.g. `code-model-builder.ts`) file.

### Generate the test code

If the feature or bug fix involves code change on generated code, you will need to re-generate the test code in one or both of the test modules.

["Generate.ps1" script](https://github.com/microsoft/typespec/blob/main/packages/http-client-java/generator/http-client-generator-clientcore-test/Generate.ps1) (internally it calls the "Setup.ps1" script) generates the code for end-to-end testing.
The code is generated from TypeSpec source from [npm `@typespec/http-specs` package](https://www.npmjs.com/package/@typespec/http-specs).

### Run the end-to-end tests

["Spector-Tests.ps1" script](https://github.com/microsoft/typespec/blob/main/packages/http-client-java/generator/http-client-generator-clientcore-test/Spector-Tests.ps1) starts the spector server, and run all the Java tests.

When writing / updating Java tests, you can manually

1. Start the test server with `npm run spector-serve` (or `npm run spector-start` to start as a background process, `npm run spector-stop` to stop).
2. Run the Java tests in the module.

## Format Code

Before creating pull request, the code is required to be well-formatted.

Run `npm run format` in "packages/http-client-java" folder.
It formats TypeScript code as well as Java code.

## Add Change Description

A change description is required to pass CI of your pull request.

Run `pnpm chronus add` in repository root to add change description.
