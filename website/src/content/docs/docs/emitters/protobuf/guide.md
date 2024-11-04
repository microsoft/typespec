---
title: Guide
---

TypeSpec includes a built-in emitter (`/protobuf`) that can generate Protocol Buffers specifications from TypeSpec sources. The Protobuf files generated can then be used to create gRPC services or any other tools that are compatible with Protocol Buffers.

**Please note**: The Protobuf emitter is designed to work with Protocol Buffers 3 (proto3) syntax. Ensure that your workflow (including `protoc` version) supports proto3 to make full use of this emitter.

## Fundamental Concepts

The Protobuf emitter allows you to write TypeSpec and transform it into corresponding Protocol Buffers for use with systems that support Protobuf (like gRPC). To successfully convert your TypeSpec models and interfaces to Protobuf, they must comply with certain rules and limitations.

### Packages

A protobuf package is established by the [`TypeSpec.Protobuf.package` decorator][protobuf-package], which is applied to a TypeSpec namespace. Essentially, a package defines a `.proto` file, and all contents within the decorated namespace are emitted into a single file.

Consider the following TypeSpec namespace, which results in a Protobuf file named `main.proto` containing the contents of the `Test` namespace, converted into Protobuf.

```typespec
@package
namespace Test {
// ...

}
```

You can specify package names using the optional `PackageDetails` argument with the `@package` decorator. The following TypeSpec namespace will create a file `com/example/test.proto` that includes the line `package com.example.test;`:

```typespec
@package({
  name: "com.example.test",
})
namespace Test {
// ...

}
```

TypeSpec entities (like models, enums, etc.) are transformed into Protobuf declarations within their closest ancestor that has a package annotation. This means that, unlike in Protobuf, TypeSpec package declarations can be nested as needed.

### Messages

TypeSpec models are translated into Protobuf messages. For instance, the following TypeSpec model:

```typespec
model TestMessage {
  @field(1) n: int32;
}
```

will be transformed into the Protobuf message below:

```proto3
message TestMessage {
  int32 n = 1;
}
```

Models are converted into messages and included in the Protobuf file if they meet any of the following conditions:

- The model is explicitly annotated with the [`TypeSpec.Protobuf.message` decorator][protobuf-message].
- The model is referenced by any service operation (refer to [Services](#services) below).
- The model is a direct child of a [package namespace](#packages) and every field is annotated with the [`TypeSpec.Protobuf.field` decorator][protobuf-field].

#### Field Indices

Protobuf requires manual specification of the offset for each field within a Protobuf message. In TypeSpec, these field indices are specified using the [`TypeSpec.Protobuf.field` decorator][protobuf-field]. To be converted into a Protobuf message, all fields within a model must have an attached `@field` decorator.

The following TypeSpec model:

```typespec
model TestMessage {
  @field(1) n: int32;
}
```

will be transformed into the Protobuf message below:

```proto3
message TestMessage {
  int32 n = 1;
}
```

### Services

TypeSpec defines a "service" using the [`TypeSpec.service` decorator][native-service], but the Protobuf "service" concept is different and is denoted by the [`TypeSpec.Protobuf.service` decorator][protobuf-service].

When using the Protobuf emitter, a Protobuf service designation is applied to an interface within a package. For example, the following TypeSpec:

```typespec
@package
namespace Example {
  @Protobuf.service
  interface Test {
    // ...
  }
}
```

will generate the following Protobuf file (named `example.proto`):

```proto3
syntax = "proto3";

package example;

service Test {
  // ...
}
```

#### Operations

Within a [service interface](#services), TypeSpec operations are represented as Protobuf service methods. Each operation in the service interface is converted into an equivalent Protobuf method declaration. For instance, the following specification:

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

The Protobuf emitter supports the declaration of an operation's streaming mode using the [`TypeSpec.Protobuf.stream` decorator][protobuf-stream]. The streaming mode is defined using the [`StreamMode`][protobuf-stream-mode] enum. An operation can have one of four streaming modes:

- `None`: This is the default mode, indicating that neither the request nor the response are streamed.

  Example: `rpc Example(In) returns (Out);`

- `In`: This mode indicates that the request is streamed, but the response is received synchronously.

  Example: `rpc Example(stream In) returns (Out);`

- `Out`: This mode indicates that the request is sent synchronously, but the response is streamed.

  Example: `rpc Example(In) returns (stream Out);`

- `Duplex`: This mode indicates that both the request and response are streamed.

  Example: `rpc Example(stream In) returns (stream Out);`

[native-service]: ../../standard-library/built-in-decorators#@service
[protobuf-service]: reference/decorators#@TypeSpec.Protobuf.service
[protobuf-package]: reference/decorators#@TypeSpec.Protobuf.package
[protobuf-field]: reference/decorators#@TypeSpec.Protobuf.field
[protobuf-stream]: reference/decorators#@TypeSpec.Protobuf.stream
[protobuf-stream-mode]: reference/data-types#TypeSpec.Protobuf.StreamMode
[protobuf-message]: reference/decorators#@TypeSpec.Protobuf.message
