---
title: Guide
---

# The Protobuf Emitter guide

TypeSpec provides an emitter (`@typespec/protobuf`) that generates Protocol Buffers specifications from TypeSpec sources as part of its standard library. The resulting Protobuf files may be used as inputs for creating gRPC services or any other tools compatible with Protocol Buffers.

**Note**: The Protobuf emitter uses Protocol Buffers 3 (proto3) syntax. Your workflow (`protoc` version, etc.) must support proto3 to utilize this emitter.

## Core concepts

The Protobuf emitter enables you to write TypeSpec and convert it into equivalent Protocol Buffers for use with Protobuf-enabled systems (such as gRPC). Your TypeSpec models and interfaces must adhere to certain requirements and restrictions in order for the emitter to convert them to Protobuf.

### Packages

A protobuf package is defined by the [`TypeSpec.Protobuf.package` decorator][protobuf-package], which applies to a TypeSpec namespace. A package essentially defines a `.proto` file, and everything within the decorated namespace will be emitted to a single file.

The following TypeSpec namespace results in a Protobuf file named `main.proto` that contains the contents of the `Test` namespace converted into Protobuf.

```typespec
@package
namespace Test {
// ...

}
```

Package names may be provided using the optional `PackageDetails` argument to the `@package` decorator. The following TypeSpec namespace will result in a file `com/example/test.proto` that has the line `package com.example.test;` within it:

```typespec
@package({
  name: "com.example.test",
})
namespace Test {
// ...

}
```

TypeSpec objects (models, enums, etc.) are converted to Protobuf declarations within their nearest ancestor that has a package annotation. As a result, unlike in Protobuf, TypeSpec declarations of packages may be nested arbitrarily.p

### Messages

TypeSpec models are converted into Protobuf messages. The following TypeSpec model:

```typespec
model TestMessage {
  @field(1) n: int32;
}
```

will be converted into the following Protobuf message:

```proto3
message TestMessage {
  int32 n = 1;
}
```

Models are converted into messages and included in the Protobuf file if any of the following conditions are met:

- The model is explicitly annotated with the [`TypeSpec.Protobuf.message` decorator][protobuf-message].
- The model is referenced by any service operation (see [Services](#services) below).
- The model is a direct child of a [package namespace](#packages) and has _every_ field annotated with the [`TypeSpec.Protobuf.field` decorator][protobuf-field].

#### Field indices

Protobuf requires that the offset of each field within a Protobuf message be manually specified. In TypeSpec, the field indices are specified using the [`TypeSpec.Protobuf.field` decorator][protobuf-field]. All fields within a model must have an attached `@field` decorator to be converted into a Protobuf message.

The following TypeSpec model:

```typespec
model TestMessage {
  @field(1) n: int32;
}
```

will be converted into the following Protobuf message:

```proto3
message TestMessage {
  int32 n = 1;
}
```

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

#### Operations

Within a [service interface](#services), TypeSpec operations represent Protobuf service methods. Each operation in the service interface is converted into an equivalent Protobuf method declaration. For example, the following specification:

```typespec
model Input {
  @field(1) exampleField: string;
}

model Output {
  @field(1) parsed: uint32;
}

@Protobuf.service
interface Example {
  testOperation(...Input): Output;
}
```

Results in the following `.proto` file:

```proto3
message Input {
  string exampleField = 1;
}

message Output {
  uint32 parsed = 1;
}

service Example {
  rpc TestOperation(Input) returns (Output);
}
```

#### Streams

The Protobuf emitter supports declaring the streaming mode of an operation using the [`TypeSpec.Protobuf.stream` decorator][protobuf-stream]. The streaming mode is specified using the [`StreamMode`][protobuf-stream-mode] enum. An operation can have one of four streaming modes:

- `None`: this is the default mode and indicates that neither the request nor response are streamed.

  Example: `rpc Example(In) returns (Out);`

- `In`: indicates that the request is streamed, but the response is received synchronously.

  Example: `rpc Example(stream In) returns (Out);`

- `Out`: indicates that the request is sent synchronously, but the response is streamed.

  Example: `rpc Example(In) returns (stream Out);`

- `Duplex`: indicates that both the request and response are streamed.

  Example: `rpc Example(stream In) returns (stream Out);`

[native-service]: ../built-in-decorators#service
[protobuf-service]: reference/decorators#@TypeSpec.Protobuf.service
[protobuf-package]: reference/decorators#@TypeSpec.Protobuf.package
[protobuf-field]: reference/decorators#@TypeSpec.Protobuf.field
[protobuf-stream]: reference/decorators#@TypeSpec.Protobuf.stream
[protobuf-stream-mode]: reference/data-types#TypeSpec.Protobuf.StreamMode
[protobuf-message]: reference/decorators#@TypeSpec.Protobuf.message
