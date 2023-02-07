[JS Api](../index.md) / Queue

# Class: Queue<T\>

## Type parameters

| Name |
| :------ |
| `T` |

## Table of contents

### Constructors

- [constructor](Queue.md#constructor)

### Properties

- [#elements](Queue.md##elements)
- [#headIndex](Queue.md##headindex)

### Methods

- [dequeue](Queue.md#dequeue)
- [enqueue](Queue.md#enqueue)
- [isEmpty](Queue.md#isempty)

## Constructors

### constructor

• **new Queue**<`T`\>(`elements?`)

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `elements?` | `T`[] |

## Properties

### #elements

• `Private` **#elements**: `T`[]

___

### #headIndex

• `Private` **#headIndex**: `number` = `0`

## Methods

### dequeue

▸ **dequeue**(): `T`

#### Returns

`T`

___

### enqueue

▸ **enqueue**(`...items`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...items` | `T`[] |

#### Returns

`void`

___

### isEmpty

▸ **isEmpty**(): `boolean`

#### Returns

`boolean`
