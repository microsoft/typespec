[JS Api](../index.md) / DecoratorValidator

# Interface: DecoratorValidator<T, P, S\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`TypeKind`](../index.md#typekind) |
| `P` | extends readonly [`DecoratorParamDefinition`](DecoratorParamDefinition.md)<[`TypeKind`](../index.md#typekind)\>[] |
| `S` | extends [`DecoratorParamDefinition`](DecoratorParamDefinition.md)<[`TypeKind`](../index.md#typekind)\> \| `undefined` = `undefined` |

## Table of contents

### Methods

- [validate](DecoratorValidator.md#validate)

## Methods

### validate

▸ **validate**(`context`, `target`, `parameters`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](DecoratorContext.md) |
| `target` | [`InferredTypeSpecValue`](../index.md#inferredtypespecvalue)<`T`\> |
| `parameters` | `InferParameters`<`P`, `S`\> |

#### Returns

`boolean`
