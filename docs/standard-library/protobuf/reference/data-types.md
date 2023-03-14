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
model Extern<Path, Name>
```

#### Template Parameters

| Name | Description                                                                              |
| ---- | ---------------------------------------------------------------------------------------- |
| Path | the relative path to a `.proto` file to import                                           |
| Name | the fully-qualified reference to the type this model represents within the `.proto` file |

### `Map` {#TypeSpec.Protobuf.Map}

A type representing a Protobuf `map`. Instances of this type in models will be converted to the built-in `map` type
in Protobuf.

The key type of a Protobuf `map` must be any integral type or `string`. The value type can be any type other than
another `Map`.

```typespec
model Map<K, V>
```

#### Template Parameters

| Name | Description                                      |
| ---- | ------------------------------------------------ |
| K    | the key type (any integral type or string)       |
| V    | the value type (any type other than another map) |

### `PackageDetails` {#TypeSpec.Protobuf.PackageDetails}

Details applied to a package definition by the [`@package`](#TODO) decorator.

```typespec
model TypeSpec.Protobuf.PackageDetails
```

### `StreamMode` {#TypeSpec.Protobuf.StreamMode}

The streaming mode of an operation. One of:

- `Duplex`: both the input and output of the operation are streaming.
- `In`: the input of the operation is streaming.
- `Out`: the output of the operation is streaming.
- `None`: neither the input nor the output are streaming.

See the [`@stream`](#TODO) decorator.

```typespec
enum TypeSpec.Protobuf.StreamMode
```
