JS Api

# JS Api

## Table of contents

### Interfaces

- [PackageDetails](interfaces/PackageDetails.md)

### Type Aliases

- [Reservation](index.md#reservation)

### Variables

- [$lib](index.md#$lib)
- [PROTO\_FULL\_IDENT](index.md#proto_full_ident)
- [namespace](index.md#namespace)

### Functions

- [$\_map](index.md#$_map)
- [$externRef](index.md#$externref)
- [$field](index.md#$field)
- [$message](index.md#$message)
- [$onEmit](index.md#$onemit)
- [$onValidate](index.md#$onvalidate)
- [$package](index.md#$package)
- [$reserve](index.md#$reserve)
- [$service](index.md#$service)
- [$stream](index.md#$stream)
- [isMap](index.md#ismap)

## Type Aliases

### Reservation

Ƭ **Reservation**: `string` \| `number` \| [`number`, `number`] & { `type`: `Type`  }

## Variables

### $lib

• `Const` **$lib**: `TypeSpecLibrary`<`Object`, `ProtobufEmitterOptions`\> = `TypeSpecProtobufLibrary`

___

### PROTO\_FULL\_IDENT

• `Const` **PROTO\_FULL\_IDENT**: `RegExp`

Defined in the [ProtoBuf Language Spec](https://developers.google.com/protocol-buffers/docs/reference/proto3-spec#identifiers).

ident = letter { letter | decimalDigit | "_" }
fullIdent = ident { "." ident }

___

### namespace

• `Const` **namespace**: ``"TypeSpec.Protobuf"``

## Functions

### $\_map

▸ **$_map**(`ctx`, `target`): `void`

Binds the internal representation of a Protobuf map.

#### Parameters

| Name | Type |
| :------ | :------ |
| `ctx` | `DecoratorContext` |
| `target` | `Model` |

#### Returns

`void`

___

### $externRef

▸ **$externRef**(`ctx`, `target`, `path`, `name`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `ctx` | `DecoratorContext` |
| `target` | `Model` |
| `path` | `StringLiteral` |
| `name` | `StringLiteral` |

#### Returns

`void`

___

### $field

▸ **$field**(`ctx`, `target`, `fieldIndex`): `void`

Decorate a model property with a field index. Field indices are required for all fields of emitted messages.

#### Parameters

| Name | Type |
| :------ | :------ |
| `ctx` | `DecoratorContext` |
| `target` | `ModelProperty` |
| `fieldIndex` | `number` |

#### Returns

`void`

___

### $message

▸ **$message**(`ctx`, `target`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `ctx` | `DecoratorContext` |
| `target` | `Model` |

#### Returns

`void`

___

### $onEmit

▸ **$onEmit**(`ctx`): `Promise`<`void`\>

Emitter main function.

#### Parameters

| Name | Type |
| :------ | :------ |
| `ctx` | `EmitContext`<`ProtobufEmitterOptions`\> |

#### Returns

`Promise`<`void`\>

___

### $onValidate

▸ **$onValidate**(`program`): `Promise`<`void`\>

Validation function

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |

#### Returns

`Promise`<`void`\>

___

### $package

▸ **$package**(`ctx`, `target`, `details?`): `void`

Declare a Protobuf package.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ctx` | `DecoratorContext` | decorator context |
| `target` | `Namespace` | target decorator namespace |
| `details?` | `Model` | - |

#### Returns

`void`

___

### $reserve

▸ **$reserve**(`ctx`, `target`, `...reservations`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `ctx` | `DecoratorContext` |
| `target` | `Model` |
| `...reservations` | readonly (`string` \| `number` \| `Type`)[] |

#### Returns

`void`

___

### $service

▸ **$service**(`ctx`, `target`): `void`

Decorate an interface as a service, indicating that it represents a Protobuf `service` declaration.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ctx` | `DecoratorContext` | decorator context |
| `target` | `Interface` | the decorated interface |

#### Returns

`void`

___

### $stream

▸ **$stream**(`ctx`, `target`, `mode`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `ctx` | `DecoratorContext` |
| `target` | `Operation` |
| `mode` | `EnumMember` |

#### Returns

`void`

___

### isMap

▸ **isMap**(`program`, `m`): `boolean`

Determines whether a type represents a Protobuf map.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | the program context |
| `m` | `Type` | the type to test |

#### Returns

`boolean`

true if the internal representation of a Protobuf map is bound to this type.
