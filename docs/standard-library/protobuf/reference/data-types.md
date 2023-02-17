---
title: "Data types"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Data types

## Cadl.Protobuf

### `Extern` {#Cadl.Protobuf.Extern}

A model that represents an external Protobuf reference. This type can be used to import and utilize Protobuf
declarations that are not declared in TypeSpec within TypeSpec sources. When the emitter encounters an `Extern`, it
will insert an `import` statement for the corresponding `Path` and refer to the type by `Name`.

#### Usage

If you have a file called `test.proto` that declares a package named `test` and a message named `Widget`, you can
use the `Extern` type to declare a model in TypeSpec that refers to your external definition of `test.Widget`. See
the example below.

When the TypeSpec definition of `Widget` is encountered, the Protobuf emitter will represent it as a reference to
`test.Widget` and insert an import for it, rather than attempt to convert the model to an equivalent message.

```cadl
model Extern<Path, Name>
```

#### Template Parameters

| Name | Description                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| Path | the relative path to a `.proto` file to import                                                               |
| Name | a string containing the fully-qualified reference to the type this model represents within the `.proto` file |

### `Map` {#Cadl.Protobuf.Map}

A type representing a Protobuf `map`. Instances of this type in models will be converted to the built-in `map` type
in Protobuf.

The key type of a Protobuf `map` must be any integral type or `string`. The value type can be any type other than
another `Map`.

```cadl
model Map<K, V>
```

#### Template Parameters

| Name | Description                                |
| ---- | ------------------------------------------ |
| K    | the key type (any integral type or string) |
| V    | the value type                             |

### `PackageDetails` {#Cadl.Protobuf.PackageDetails}

Details applied to a package definition by the [

```cadl
model Cadl.Protobuf.PackageDetails
```

### `StreamMode` {#Cadl.Protobuf.StreamMode}

The streaming mode of an operation.

```cadl
enum Cadl.Protobuf.StreamMode
```
