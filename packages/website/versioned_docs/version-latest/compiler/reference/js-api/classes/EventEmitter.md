[JS Api](../index.md) / EventEmitter

# Class: EventEmitter<T\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Object` |

## Table of contents

### Constructors

- [constructor](EventEmitter.md#constructor)

### Properties

- [listeners](EventEmitter.md#listeners)

### Methods

- [emit](EventEmitter.md#emit)
- [on](EventEmitter.md#on)

## Constructors

### constructor

• **new EventEmitter**<`T`\>()

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Object` |

## Properties

### listeners

• `Private` **listeners**: `Map`<keyof `T`, (...`args`: `any`[]) => `any`[]\>

## Methods

### emit

▸ **emit**<`K`\>(`name`, `...args`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `K` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `K` |
| `...args` | `Parameters`<`T`[`K`]\> |

#### Returns

`void`

___

### on

▸ **on**<`K`\>(`name`, `listener`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `K` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `K` |
| `listener` | (...`args`: `Parameters`<`T`[`K`]\>) => `any` |

#### Returns

`void`
