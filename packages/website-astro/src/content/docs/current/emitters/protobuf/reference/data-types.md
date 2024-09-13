---
title: "Data types"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Data types

## TypeSpec.Protobuf

### `Extern` {#TypeSpec.Protobuf.Extern}

A model that represents an external Protobuf reference. This type can be used to import and utilize Protobuf
declarations that are not declared in TypeSpec within TypeSpec sources. When the emitter encounters an `Extern`, it
will insert an `import` statement for the corresponding `Path` and refer to the type by `Name`.

#### Usage

If you have a file called `test.proto` that declares a package named `test` and a message named `Widget`, you can
use the `Extern` type to declare a model in TypeSpec that refers to your external definition of `test.Widget`. See
the example below.

When the TypeSpec definition of `Widget` is encountered, the Protobuf emitter will represent it as a reference to
`test.Widget` and insert an import for it, rather than attempt to convert the model to an equivalent message.

```typespec
model TypeSpec.Protobuf.Extern<Path, Name>
```

#### Template Parameters

| Name | Description                                                                              |
| ---- | ---------------------------------------------------------------------------------------- |
| Path | the relative path to a `.proto` file to import                                           |
| Name | the fully-qualified reference to the type this model represents within the `.proto` file |

#### Examples

```typespec
model Widget is Extern<"path/to/test.proto", "test.Widget">;
```

#### Properties

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_extern | `never` |             |

### `Map` {#TypeSpec.Protobuf.Map}

A type representing a Protobuf `map`. Instances of this type in models will be converted to the built-in `map` type
in Protobuf.

The key type of a Protobuf `map` must be any integral type or `string`. The value type can be any type other than
another `Map`.

```typespec
model TypeSpec.Protobuf.Map<Key, Value>
```

#### Template Parameters

| Name  | Description                                      |
| ----- | ------------------------------------------------ |
| Key   | the key type (any integral type or string)       |
| Value | the value type (any type other than another map) |

#### Properties

None

### `PackageDetails` {#TypeSpec.Protobuf.PackageDetails}

Details applied to a package definition by the [`@package`](./decorators#

```typespec
model TypeSpec.Protobuf.PackageDetails
```

#### Properties

| Name     | Type                                   | Description                                                                                                                                                                                                                                           |
| -------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name?    | `string`                               | The package's name.<br /><br />By default, the package's name is constructed from the namespace it is applied to.                                                                                                                                     |
| options? | `Record<string \| boolean \| numeric>` | The package's top-level options.<br /><br />See the [Protobuf Language Guide - Options](https://protobuf.dev/programming-guides/proto3/#options) for more information.<br /><br />Currently, only string, boolean, and numeric options are supported. |

### `StreamMode` {#TypeSpec.Protobuf.StreamMode}

The streaming mode of an operation. One of:

- `Duplex`: both the input and output of the operation are streaming.
- `In`: the input of the operation is streaming.
- `Out`: the output of the operation is streaming.
- `None`: neither the input nor the output are streaming.

See the [`@stream`](./decorators#

```typespec
enum TypeSpec.Protobuf.StreamMode
```

| Name   | Value | Description                                                                                                                                                     |
| ------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplex |       | Both the input and output of the operation are streaming. Both the client and service will stream messages to each<br />other until the connections are closed. |
| In     |       | The input of the operation is streaming. The client will send a stream of events; and, once the stream is closed,<br />the service will respond with a message. |
| Out    |       | The output of the operation is streaming. The client will send a message to the service, and the service will send<br />a stream of events back to the client.  |
| None   |       | Neither the input nor the output are streaming. This is the default mode of an operation without the `@stream`<br />decorator.                                  |

### `fixed32` {#TypeSpec.Protobuf.fixed32}

An unsigned 32-bit integer that will use the `fixed32` encoding when used in a Protobuf message.

#### Protobuf binary format

Always four bytes. More efficient than `uint32` if values are often greater than 2<sup>28</sup>.

```typespec
scalar TypeSpec.Protobuf.fixed32
```

### `fixed64` {#TypeSpec.Protobuf.fixed64}

An unsigned 64-bit integer that will use the `fixed64` encoding when used in a Protobuf message.

#### Protobuf binary format

Always eight bytes. More efficient than `uint64` if values are often greater than 2<sup>56</sup>.

```typespec
scalar TypeSpec.Protobuf.fixed64
```

### `sfixed32` {#TypeSpec.Protobuf.sfixed32}

A signed 32-bit integer that will use the `sfixed32` encoding when used in a Protobuf message.

#### Protobuf binary format

Always four bytes.

```typespec
scalar TypeSpec.Protobuf.sfixed32
```

### `sfixed64` {#TypeSpec.Protobuf.sfixed64}

A signed 64-bit integer that will use the `sfixed64` encoding when used in a Protobuf message.

#### Protobuf binary format

Always eight bytes.

```typespec
scalar TypeSpec.Protobuf.sfixed64
```

### `sint32` {#TypeSpec.Protobuf.sint32}

A signed 32-bit integer that will use the `sint32` encoding when used in a Protobuf message.

#### Protobuf binary format

Uses variable-length encoding. These more efficiently encode negative numbers than regular int32s.

```typespec
scalar TypeSpec.Protobuf.sint32
```

### `sint64` {#TypeSpec.Protobuf.sint64}

A signed 64-bit integer that will use the `sint64` encoding when used in a Protobuf message.

#### Protobuf binary format

Uses variable-length encoding. These more efficiently encode negative numbers than regular `int64s`.

```typespec
scalar TypeSpec.Protobuf.sint64
```

## TypeSpec.Protobuf.WellKnown

### `Any` {#TypeSpec.Protobuf.WellKnown.Any}

Any value.

This model references `google.protobuf.Any` from `google/protobuf/any.proto`.

```typespec
model TypeSpec.Protobuf.WellKnown.Any
```

#### Properties

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_extern | `never` |             |

### `Empty` {#TypeSpec.Protobuf.WellKnown.Empty}

An empty message.

This model references `google.protobuf.Empty` from `google/protobuf/empty.proto`.

```typespec
model TypeSpec.Protobuf.WellKnown.Empty
```

#### Properties

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_extern | `never` |             |

### `LatLng` {#TypeSpec.Protobuf.WellKnown.LatLng}

A latitude and longitude.

This model references `google.type.LatLng` from `google/type/latlng.proto`.

```typespec
model TypeSpec.Protobuf.WellKnown.LatLng
```

#### Properties

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_extern | `never` |             |

### `Timestamp` {#TypeSpec.Protobuf.WellKnown.Timestamp}

A timestamp.

This model references `google.protobuf.Timestamp` from `google/protobuf/timestamp.proto`.

```typespec
model TypeSpec.Protobuf.WellKnown.Timestamp
```

#### Properties

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_extern | `never` |             |
