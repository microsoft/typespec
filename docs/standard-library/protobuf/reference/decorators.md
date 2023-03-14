---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## TypeSpec.Protobuf

### `@field` {#@TypeSpec.Protobuf.field}

Defines the field index of a model property for conversion to a Protobuf
message.

The field index of a Protobuf message must:

- fall between 1 and 2<sup>29</sup> - 1, inclusive.
- not fall within the implementation reserved range of 19000 to 19999, inclusive.
- not fall within any range that was [marked reserved](#

```typespec
dec TypeSpec.Protobuf.field(target: TypeSpec.Reflection.ModelProperty, index: TypeSpec.uint32)
```

#### Target

`ModelProperty`

#### Parameters

| Name  | Type                     | Description                          |
| ----- | ------------------------ | ------------------------------------ |
| index | `scalar TypeSpec.uint32` | The whole-number index of the field. |

### `@reserve` {#@TypeSpec.Protobuf.reserve}

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
dec TypeSpec.Protobuf.reserve(target: TypeSpec.object, ...reservations: TypeSpec.string | [TypeSpec.uint32, TypeSpec.uint32] | TypeSpec.uint32[])
```

#### Target

`model TypeSpec.object`

#### Parameters

| Name         | Type                                                                               | Description                  |
| ------------ | ---------------------------------------------------------------------------------- | ---------------------------- |
| reservations | `model TypeSpec.string \| [TypeSpec.uint32, TypeSpec.uint32] \| TypeSpec.uint32[]` | a list of field reservations |

### `@service` {#@TypeSpec.Protobuf.service}

Declares that a TypeSpec interface constitutes a Protobuf service. The contents of the interface will be converted to
a `service` declaration in the resulting Protobuf file.

```typespec
dec TypeSpec.Protobuf.service(target: TypeSpec.Reflection.Interface)
```

#### Target

`Interface`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

### `@package` {#@TypeSpec.Protobuf.package}

Declares that a TypeSpec namespace constitutes a Protobuf package. The contents of the namespace will be emitted to a
single Protobuf file.

```typespec
dec TypeSpec.Protobuf.package(target: TypeSpec.Reflection.Namespace, details?: TypeSpec.Protobuf.PackageDetails)
```

#### Target

`Namespace`

#### Parameters

| Name    | Type                                     | Description                         |
| ------- | ---------------------------------------- | ----------------------------------- |
| details | `model TypeSpec.Protobuf.PackageDetails` | the optional details of the package |

### `@stream` {#@TypeSpec.Protobuf.stream}

Set the streaming mode of an operation. See [StreamMode](#TODO) for more information.

```typespec
dec TypeSpec.Protobuf.stream(target: TypeSpec.Reflection.Operation, mode: TypeSpec.Protobuf.StreamMode)
```

#### Target

`Operation`

#### Parameters

| Name | Type                                | Description                                    |
| ---- | ----------------------------------- | ---------------------------------------------- |
| mode | `enum TypeSpec.Protobuf.StreamMode` | The streaming mode to apply to this operation. |
