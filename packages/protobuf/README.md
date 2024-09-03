# @typespec/protobuf

TypeSpec library and emitter for Protobuf (gRPC)

## Install

```bash
npm install @typespec/protobuf
```

## Emitter

### Usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/protobuf
```

2. Via the config

```yaml
emit:
  - "@typespec/protobuf"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/protobuf"
options:
  "@typespec/protobuf":
    option: value
```

### Emitter options

#### `noEmit`

**Type:** `boolean`

If set to `true`, this emitter will not write any files. It will still validate the TypeSpec sources to ensure they are compatible with Protobuf, but the files will simply not be written to the output directory.

#### `omit-unreachable-types`

**Type:** `boolean`

By default, the emitter will create `message` declarations for any models in a namespace decorated with `@package` that have an `@field` decorator on every property. If this option is set to true, this behavior will be disabled, and only messages that are explicitly decorated with `@message` or that are reachable from a service operation will be emitted.

## Decorators

### TypeSpec.Protobuf

- [`@field`](#@field)
- [`@message`](#@message)
- [`@package`](#@package)
- [`@reserve`](#@reserve)
- [`@service`](#@service)
- [`@stream`](#@stream)

#### `@field`

Defines the field index of a model property for conversion to a Protobuf
message.

The field index of a Protobuf message must:

- fall between 1 and 2<sup>29</sup> - 1, inclusive.
- not fall within the implementation reserved range of 19000 to 19999, inclusive.
- not fall within any range that was [marked reserved](#

```typespec
@TypeSpec.Protobuf.field(index: valueof uint32)
```

##### Target

`ModelProperty`

##### Parameters

| Name  | Type             | Description                          |
| ----- | ---------------- | ------------------------------------ |
| index | `valueof uint32` | The whole-number index of the field. |

##### Examples

```typespec
model ExampleMessage {
  @field(1)
  test: string;
}
```

#### `@message`

Declares that a model is a Protobuf message.

Messages can be detected automatically if either of the following two conditions are met:

- The model has a `@field` annotation on all of its properties.
- The model is referenced by any service operation.

This decorator will force the emitter to check and emit a model.

```typespec
@TypeSpec.Protobuf.message
```

##### Target

`{}`

##### Parameters

None

#### `@package`

Declares that a TypeSpec namespace constitutes a Protobuf package. The contents of the namespace will be emitted to a
single Protobuf file.

```typespec
@TypeSpec.Protobuf.package(details?: TypeSpec.Protobuf.PackageDetails)
```

##### Target

`Namespace`

##### Parameters

| Name    | Type                                | Description                         |
| ------- | ----------------------------------- | ----------------------------------- |
| details | [`PackageDetails`](#packagedetails) | the optional details of the package |

#### `@reserve`

Reserve a field index, range, or name. If a field definition collides with a reservation, the emitter will produce
an error.

This decorator accepts multiple reservations. Each reservation is one of the following:

- a `string`, in which case the reservation refers to a field name.
- a `uint32`, in which case the reservation refers to a field index.
- a tuple `[uint32, uint32]`, in which case the reservation refers to a field range that is _inclusive_ of both ends.

Unlike in Protobuf, where field name and index reservations must be separated, you can mix string and numeric field
reservations in a single `@reserve` call in TypeSpec.

#### API Compatibility Note

Field reservations prevent users of your Protobuf specification from using the given field names or indices. This can
be useful if a field is removed, as it will further prevent adding a new, incompatible field and will prevent users
from utilizing the field index at runtime in a way that may break compatibility with users of older specifications.

See _[Protobuf Language Guide - Reserved Fields](https://protobuf.dev/programming-guides/proto3/#reserved)_ for more
information.

```typespec
@TypeSpec.Protobuf.reserve(...reservations: valueof string | [uint32, uint32] | uint32[])
```

##### Target

`{}`

##### Parameters

| Name         | Type                                             | Description                  |
| ------------ | ------------------------------------------------ | ---------------------------- |
| reservations | `valueof string \| [uint32, uint32] \| uint32[]` | a list of field reservations |

##### Examples

```typespec
// Reserve the fields 8-15 inclusive, 100, and the field name "test" within a model.
@reserve([8, 15], 100, "test")
model Example {
  // ...
}
```

#### `@service`

Declares that a TypeSpec interface constitutes a Protobuf service. The contents of the interface will be converted to
a `service` declaration in the resulting Protobuf file.

```typespec
@TypeSpec.Protobuf.service
```

##### Target

`Interface`

##### Parameters

None

#### `@stream`

Set the streaming mode of an operation. See [StreamMode](./data-types#TypeSpec.Protobuf.StreamMode) for more information.

```typespec
@TypeSpec.Protobuf.stream(mode: TypeSpec.Protobuf.StreamMode)
```

##### Target

`Operation`

##### Parameters

| Name | Type                        | Description                                    |
| ---- | --------------------------- | ---------------------------------------------- |
| mode | [`StreamMode`](#streammode) | The streaming mode to apply to this operation. |

##### Examples

```typespec
@stream(StreamMode.Out)
op logs(...LogsRequest): LogEvent;
```

```typespec
@stream(StreamMode.Duplex)
op connectToMessageService(...Message): Message;
```
