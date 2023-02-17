---
title: Overview
---

# The Protobuf Emitter

TypeSpec provides an emitter (`@typespec/protobuf`) that generates Protocol Buffers specifications from TypeSpec sources as part of its standard library. The resulting Protobuf files may be used as inputs for creating gRPC services or any other tools compatible with Protocol Buffers.

**Note**: The Protobuf emitter uses Protocol Buffers 3 (proto3) syntax. Your workflow (`protoc` version, etc.) must support proto3 to utilize this emitter.

## Install

In the project root, install the emitter using your JavaScript package manager of choice. For example, using NPM:

```bash
npm install @typespec/protobuf
```

## Installing and enabling

The `@typespec/protobuf` package provides an emitter that must be enabled in order to generate Protobuf files. Enable it by adding it to your TypeSpec compiler invocation on the CLI or the project configuration file:

1. Via the CLI

```bash
typespec compile . --emit @typespec/protobuf
```

2. Via the project configuration

Add the Protobuf emitter to the `emitters` entry (or create one if it does not exist) in `typespec-project.yaml`:

```yaml
emitters:
  @typespec/protobuf: true
```

With this configuration entry, Protobuf files will be generated every time the project is compiled using `typespec compile .`.

## Core concepts

The Protobuf emitter enables you to write TypeSpec and convert it into equivalent Protocol Buffers for use with Protobuf-enabled systems (such as gRPC). Your TypeSpec models and interfaces must adhere to certain requirements and restrictions in order for the emitter to convert them to Protobuf.

### Field indices

Protobuf requires that the offset of each field within a Protobuf message be manually specified. In TypeSpec, the field indices are specified using the [`TypeSpec.Protobuf.field` decorator][protobuf-field]. All fields within a model must have an attached `@field` decorator to be converted into a Protobuf message.

The following TypeSpec model:

```typespec
model TestMessage {
  @field(1) n: int32
}
```

will be converted into the following Protobuf message:

```proto3
message TestMessage {
  int32 n = 1;
}
```

### Packages

A protobuf package is defined by the [`TypeSpec.Protobuf.package` decorator][protobuf-package], which applies to a TypeSpec namespace. A package essentially defines a `.proto` file, and everything within the decorated namespace will be emitted to a single file.

The following TypeSpec namespace results in a Protobuf file named `test.proto` that has the line `package test;` within it.

```typespec
@package
namespace Test {
  // ...
}
```

Package names may be explicitly overridden by providing an optional `PackageDetails` item to the `@package` decorator. The following TypeSpec namespace will result in a file `com/example/test.proto` that has the line `package com.example.test;` within it:

```typespec
@package({
  name: "com.example.test"
})
namespace Test {
  // ...
}
```

The TypeSpec program's root namespace is implicitly a package that has no name and will be emitted to `main.proto` if it is not empty. TypeSpec objects (models, enums, etc.) are converted to Protobuf declarations within their nearest ancestor that has a package annotation. As a result, unlike in Protobuf, TypeSpec declarations of packages may be nested arbitrarily.

### Services

TypeSpec has a concept of a "service" defined by the [`TypeSpec.service` decorator][native-service], but the Protobuf concept of a "service" is different and is indicated by the [`TypeSpec.Protobuf.service` decorator][protobuf-service].

When using the Protobuf emitter, a Protobuf service designation is applied to an _interface_ within a package. For example, the following TypeSpec:

```typespec
@package
namespace Example {
  @Protobuf.service
  interface Test {
    // ...
  }
}
```

will yield the following Protobuf file (named `example.proto`):

```proto3
syntax = "proto3";

package example;

service Test {
  // ...
}
```

### Operations

Within a [service interface](#services), TypeSpec operations represent Protobuf service methods. Each operation in the service interface is converted into an equivalent Protobuf method declaration.

### Streams

The Protobuf emitter supports declaring the streaming mode of an operation using the [`TypeSpec.Protobuf.stream` decorator][protobuf-stream]. The streaming mode is specified by the

## Emitter options

Emitter options can be provided to the CLI with

```bash
--option "@typespec/protobuf.<optionName>=<value>"

# For example
--option "@typespec/protobuf.noEmit=true"
```

or configured through the `typespec-project.yaml` project configuration:

```yaml
emitters:
  '@typespec/protobuf':
    <optionName>: <value>

# For example
emitters:
  '@typespec/protobuf':
    noEmit: true
```

#### `noEmit`

If set to `true`, this emitter will not write any files. It will still validate the TypeSpec sources to ensure they are compatible with Protobuf, but the files will simply not be written to the output directory.
