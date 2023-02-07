[JS Api](../index.md) / DuplicateTracker

# Class: DuplicateTracker<K, V\>

Helper class to track duplicate instance

## Type parameters

| Name |
| :------ |
| `K` |
| `V` |

## Table of contents

### Constructors

- [constructor](DuplicateTracker.md#constructor)

### Properties

- [#entries](DuplicateTracker.md##entries)

### Methods

- [entries](DuplicateTracker.md#entries)
- [track](DuplicateTracker.md#track)

## Constructors

### constructor

• **new DuplicateTracker**<`K`, `V`\>()

#### Type parameters

| Name |
| :------ |
| `K` |
| `V` |

## Properties

### #entries

• `Private` **#entries**: `Map`<`K`, `V`[]\>

## Methods

### entries

▸ **entries**(): `Iterable`<[`K`, `V`[]]\>

Return iterator of all the duplicate entries.

#### Returns

`Iterable`<[`K`, `V`[]]\>

___

### track

▸ **track**(`k`, `v`): `void`

Track usage of K.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `k` | `K` | key that is being checked for duplicate. |
| `v` | `V` | value that map to the key |

#### Returns

`void`
