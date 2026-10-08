# @typespec/protobuf

TypeSpec library and emitter for Protobuf (gRPC)

## Install

```bash
npm install @typespec/protobuf
```

## Emitter usage

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

## Emitter options

### `emitter-output-dir`

**Type:** `absolutePath`

Defines the emitter output directory. Defaults to `{output-dir}/@typespec/protobuf`
See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)

### `noEmit`

**Type:** `boolean`

If set to `true`, this emitter will not write any files. It will still validate the TypeSpec sources to ensure they are compatible with Protobuf, but the files will simply not be written to the output directory.

### `omit-unreachable-types`

**Type:** `boolean`

By default, the emitter will create `message` declarations for any models in a namespace decorated with `@package` that have an `@field` decorator on every property. If this option is set to true, this behavior will be disabled, and only messages that are explicitly decorated with `@message` or that are reachable from a service operation will be emitted.

### `enum-value-prefix`

**Type:** `"none" | "enum-name"`

**Default:** `"none"`

When set to `enum-name`, enum values are prefixed with the enum name in UPPER_SNAKE_CASE. Already-prefixed names are preserved. By default (`none`), member names are emitted unchanged. This option only changes names; explicit integer values and a first member set to zero are still required.

## Decorators

### TypeSpec.Protobuf

- [`@field`](#@field)
- [`@message`](#@message)
- [`@package`](#@package)
- [`@reserve`](#@reserve)
- [`@service`](#@service)
- [`@stream`](#@stream)

#### `@field`

Defines the field index of a model property or union variant for conversion to a Protobuf
message.

When applied to the variants of a named union, the union can be used as the type of a message field:

- If the model property has no `@field` decorator, the union is emitted inline as a `oneof` named after the
  property, and the variant field indices share the field index space of the containing message. The property
  must be optional.
- If the model property has a `@field` decorator, the union is emitted as a wrapper message (named after the
  union) that contains a `oneof value`, and the variant field indices belong to the wrapper message.

Union variants used in a `oneof` cannot be arrays or maps.

The field index of a Protobuf message must:

- fall between 1 and 2<sup>29</sup> - 1, inclusive.
- not fall within the implementation reserved range of 19000 to 19999, inclusive.
- not fall within any range that was [marked reserved](#%40TypeSpec.Protobuf.reserve).
- not be used by any other field of the same message, including members of a `oneof`.

#### API Compatibility Note

Fields are accessed by index, so changing the index of a field is an API breaking change.

#### Encoding

Field indices between 1 and 15 are encoded using a single byte, while field indices from 16 through 2047 require two
bytes, so those indices between 1 and 15 should be preferred and reserved for elements that are frequently or always
set in the message. See the [Protobuf binary format](https://protobuf.dev/programming-guides/encoding/).

```typespec
@TypeSpec.Protobuf.field(index: valueof uint32)
```

##### Target

`ModelProperty | UnionVariant`

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

```typespec
union Payment {
  @field(10) card: CardPayment,
  @field(11) bank_transfer: BankTransfer,
}

model Order {
  @field(1) id: string;

  // Emitted inline as `oneof payment { CardPayment card = 10; BankTransfer bank_transfer = 11; }`
  payment?: Payment;
}
```

#### `@message`

Declares that a model is a Protobuf message.

Messages can be detected automatically if either of the following two conditions are met:

- The model has a `@field` annotation on all of its properties.
- The model is referenced by any service operation.

This decorator will force the emitter to check and emit a model. A named union annotated with this decorator is
emitted as a wrapper message containing a `oneof value`.

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
