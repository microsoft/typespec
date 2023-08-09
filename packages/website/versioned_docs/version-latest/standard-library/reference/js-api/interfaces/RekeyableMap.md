[JS Api](../index.md) / RekeyableMap

# Interface: RekeyableMap<K, V\>

A map where keys can be changed without changing enumeration order.

## Type parameters

| Name |
| :------ |
| `K` |
| `V` |

## Hierarchy

- `Map`<`K`, `V`\>

  ↳ **`RekeyableMap`**

## Table of contents

### Properties

- [[toStringTag]](RekeyableMap.md#[tostringtag])
- [size](RekeyableMap.md#size)

### Methods

- [[iterator]](RekeyableMap.md#[iterator])
- [clear](RekeyableMap.md#clear)
- [delete](RekeyableMap.md#delete)
- [entries](RekeyableMap.md#entries)
- [forEach](RekeyableMap.md#foreach)
- [get](RekeyableMap.md#get)
- [has](RekeyableMap.md#has)
- [keys](RekeyableMap.md#keys)
- [rekey](RekeyableMap.md#rekey)
- [set](RekeyableMap.md#set)
- [values](RekeyableMap.md#values)

## Properties

### [toStringTag]

• `Readonly` **[toStringTag]**: `string`

#### Inherited from

Map.[toStringTag]

___

### size

• `Readonly` **size**: `number`

#### Inherited from

Map.size

## Methods

### [iterator]

▸ **[iterator]**(): `IterableIterator`<[`K`, `V`]\>

Returns an iterable of entries in the map.

#### Returns

`IterableIterator`<[`K`, `V`]\>

#### Inherited from

Map.[iterator]

___

### clear

▸ **clear**(): `void`

#### Returns

`void`

#### Inherited from

Map.clear

___

### delete

▸ **delete**(`key`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |

#### Returns

`boolean`

true if an element in the Map existed and has been removed, or false if the element does not exist.

#### Inherited from

Map.delete

___

### entries

▸ **entries**(): `IterableIterator`<[`K`, `V`]\>

Returns an iterable of key, value pairs for every entry in the map.

#### Returns

`IterableIterator`<[`K`, `V`]\>

#### Inherited from

Map.entries

___

### forEach

▸ **forEach**(`callbackfn`, `thisArg?`): `void`

Executes a provided function once per each key/value pair in the Map, in insertion order.

#### Parameters

| Name | Type |
| :------ | :------ |
| `callbackfn` | (`value`: `V`, `key`: `K`, `map`: `Map`<`K`, `V`\>) => `void` |
| `thisArg?` | `any` |

#### Returns

`void`

#### Inherited from

Map.forEach

___

### get

▸ **get**(`key`): `undefined` \| `V`

Returns a specified element from the Map object. If the value that is associated to the provided key is an object, then you will get a reference to that object and any change made to that object will effectively modify it inside the Map.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |

#### Returns

`undefined` \| `V`

Returns the element associated with the specified key. If no element is associated with the specified key, undefined is returned.

#### Inherited from

Map.get

___

### has

▸ **has**(`key`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |

#### Returns

`boolean`

boolean indicating whether an element with the specified key exists or not.

#### Inherited from

Map.has

___

### keys

▸ **keys**(): `IterableIterator`<`K`\>

Returns an iterable of keys in the map

#### Returns

`IterableIterator`<`K`\>

#### Inherited from

Map.keys

___

### rekey

▸ **rekey**(`existingKey`, `newKey`): `boolean`

Change the given key without impacting enumeration order.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `existingKey` | `K` | Existing key |
| `newKey` | `K` | New key |

#### Returns

`boolean`

boolean if updated successfully.

___

### set

▸ **set**(`key`, `value`): [`RekeyableMap`](RekeyableMap.md)<`K`, `V`\>

Adds a new element with a specified key and value to the Map. If an element with the same key already exists, the element will be updated.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |
| `value` | `V` |

#### Returns

[`RekeyableMap`](RekeyableMap.md)<`K`, `V`\>

#### Inherited from

Map.set

___

### values

▸ **values**(): `IterableIterator`<`V`\>

Returns an iterable of values in the map

#### Returns

`IterableIterator`<`V`\>

#### Inherited from

Map.values
