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

### `Map` {#TypeSpec.Protobuf.Map}

A type representing a Protobuf `map`. Instances of this type in models will be converted to the built-in `map` type
in Protobuf.

The key type of a Protobuf `map` must be any integral type or `string`. The value type can be any type other than
another `Map`.

```typespec
model TypeSpec.Protobuf.Map<K, V>
```

#### Template Parameters

| Name | Description                                      |
| ---- | ------------------------------------------------ |
| K    | the key type (any integral type or string)       |
| V    | the value type (any type other than another map) |

### `PackageDetails` {#TypeSpec.Protobuf.PackageDetails}

Details applied to a package definition by the [`@package`](./decorators#

```typespec
model TypeSpec.Protobuf.PackageDetails
```

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
