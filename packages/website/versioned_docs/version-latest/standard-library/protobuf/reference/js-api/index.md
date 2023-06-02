JS Api

# JS Api

## Table of contents

### Interfaces

- [ProtobufEmitterOptions](interfaces/ProtobufEmitterOptions.md)

### Type Aliases

- [TypeSpecProtobufLibrary](index.md#typespecprotobuflibrary)

### Variables

- [TypeSpecProtobufLibrary](index.md#typespecprotobuflibrary-1)
- [state](index.md#state)

### Functions

- [$onEmit](index.md#$onemit)
- [reportDiagnostic](index.md#reportdiagnostic)

## Type Aliases

### TypeSpecProtobufLibrary

Ƭ **TypeSpecProtobufLibrary**: typeof [`TypeSpecProtobufLibrary`](index.md#typespecprotobuflibrary-1)

## Variables

### TypeSpecProtobufLibrary

• `Const` **TypeSpecProtobufLibrary**: `TypeSpecLibrary`<`Object`, [`ProtobufEmitterOptions`](interfaces/ProtobufEmitterOptions.md)\>

___

### state

• `Const` **state**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `_map` | `symbol` |
| `externRef` | `symbol` |
| `fieldIndex` | `symbol` |
| `message` | `symbol` |
| `package` | `symbol` |
| `reserve` | `symbol` |
| `service` | `symbol` |
| `stream` | `symbol` |

## Functions

### $onEmit

▸ **$onEmit**(`ctx`): `Promise`<`void`\>

Emitter main function.

#### Parameters

| Name | Type |
| :------ | :------ |
| `ctx` | `EmitContext`<[`ProtobufEmitterOptions`](interfaces/ProtobufEmitterOptions.md)\> |

#### Returns

`Promise`<`void`\>

___

### reportDiagnostic

▸ **reportDiagnostic**<`C`, `M`\>(`program`, `diag`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `C` | extends ``"package"`` \| ``"field-index"`` \| ``"field-name"`` \| ``"root-operation"`` \| ``"unsupported-intrinsic"`` \| ``"unsupported-return-type"`` \| ``"unsupported-input-type"`` \| ``"unsupported-field-type"`` \| ``"namespace-collision"`` \| ``"unconvertible-enum"`` \| ``"nested-array"`` \| ``"invalid-package-name"`` \| ``"illegal-reservation"`` \| ``"model-not-in-package"`` \| ``"anonymous-model"`` |
| `M` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `diag` | `DiagnosticReport`<`Object`, `C`, `M`\> |

#### Returns

`void`
