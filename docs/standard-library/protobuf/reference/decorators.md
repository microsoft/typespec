---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## Cadl.Protobuf

### `@field` {#@Cadl.Protobuf.field}

Defines the field index of a model property for conversion to a Protobuf
message.

The field index of a Protobuf message must:

- fall between 1 and 2<sup>29</sup> - 1, inclusive.
- not fall within the implementation reserved range of 19000 to 19999, inclusive.
- not fall within any range that was [marked reserved](#

```cadl
dec Cadl.Protobuf.field(target: Cadl.Reflection.ModelProperty, index: Cadl.uint32)
```

#### Target

`ModelProperty`

#### Parameters

| Name  | Type                 | Description                          |
| ----- | -------------------- | ------------------------------------ |
| index | `scalar Cadl.uint32` | The whole-number index of the field. |

### `@reserve` {#@Cadl.Protobuf.reserve}

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

Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int3

```cadl
dec Cadl.Protobuf.reserve(target: Cadl.object, ...reservations: Cadl.string | [Cadl.uint32, Cadl.uint32] | Cadl.uint32[])
```

#### Target

`model Cadl.object`

#### Parameters

| Name         | Type                                                               | Description                  |
| ------------ | ------------------------------------------------------------------ | ---------------------------- |
| reservations | `model Cadl.string \| [Cadl.uint32, Cadl.uint32] \| Cadl.uint32[]` | a list of field reservations |

### `@service` {#@Cadl.Protobuf.service}

Declares that a TypeSPec interface constitutes a Protobuf service. The contents of the interface will be converted to
a `service` declaration in the resulting Protobuf file.

```cadl
dec Cadl.Protobuf.service(target: Cadl.Reflection.Interface)
```

#### Target

`Interface`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

### `@package` {#@Cadl.Protobuf.package}

Declares that a TypeSpec namespace constitutes a Protobuf package. The contents of the namespace will be emitted to a
single Protobuf file.

```cadl
dec Cadl.Protobuf.package(target: Cadl.Reflection.Namespace, details?: Cadl.Protobuf.PackageDetails)
```

#### Target

`Namespace`

#### Parameters

| Name    | Type                                 | Description                         |
| ------- | ------------------------------------ | ----------------------------------- |
| details | `model Cadl.Protobuf.PackageDetails` | the optional details of the package |

### `@stream` {#@Cadl.Protobuf.stream}

Set the streaming mode of an operation. See [StreamMode](#TODO) for more information.

```cadl
dec Cadl.Protobuf.stream(target: Cadl.Reflection.Operation, mode: Cadl.Protobuf.StreamMode)
```

#### Target

`Operation`

#### Parameters

| Name | Type                            | Description                                    |
| ---- | ------------------------------- | ---------------------------------------------- |
| mode | `enum Cadl.Protobuf.StreamMode` | The streaming mode to apply to this operation. |
