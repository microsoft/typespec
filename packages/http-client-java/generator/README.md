# Microsoft Java client generator

The **Microsoft Java client generator** tool generates client libraries for accessing RESTful web services.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Build](#build)
- [Test](#test)

## Prerequisites

- [Java 17 or above](https://docs.microsoft.com/java/openjdk/download)
- [Maven](https://maven.apache.org/download.cgi)

## Build

1. `mvn clean compile` (from packages/http-client-java/generator directory)

## Test

1. `mvn clean test` (from packages/http-client-java/generator directory)

## Debug

### Debugging Java Code

Run `Main` class

- Add `--add-exports jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED --add-exports jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED --add-exports jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED --add-exports jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED --add-exports jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED` to VM options.
