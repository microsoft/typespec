[JS Api](../index.md) / TwoLevelMap

# Class: TwoLevelMap<K1, K2, V\>

A map with exactly two keys per value.

Functionally the same as `MultiKeyMap<[K1, K2], V>`, but more efficient.

## Type parameters

| Name |
| :------ |
| `K1` |
| `K2` |
| `V` |

## Hierarchy

- `Map`<`K1`, `Map`<`K2`, `V`\>\>

  ↳ **`TwoLevelMap`**

## Table of contents

### Constructors

- [constructor](TwoLevelMap.md#constructor)

### Properties

- [[toStringTag]](TwoLevelMap.md#[tostringtag])
- [size](TwoLevelMap.md#size)
- [[species]](TwoLevelMap.md#[species])

### Methods

- [[iterator]](TwoLevelMap.md#[iterator])
- [clear](TwoLevelMap.md#clear)
- [delete](TwoLevelMap.md#delete)
- [entries](TwoLevelMap.md#entries)
- [forEach](TwoLevelMap.md#foreach)
- [get](TwoLevelMap.md#get)
- [getOrAdd](TwoLevelMap.md#getoradd)
- [has](TwoLevelMap.md#has)
- [keys](TwoLevelMap.md#keys)
- [set](TwoLevelMap.md#set)
- [values](TwoLevelMap.md#values)

## Constructors

### constructor

• **new TwoLevelMap**<`K1`, `K2`, `V`\>(`entries?`)

#### Type parameters

| Name |
| :------ |
| `K1` |
| `K2` |
| `V` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `entries?` | ``null`` \| readonly readonly [`K1`, `Map`<`K2`, `V`\>][] |

#### Inherited from

Map<K1, Map<K2, V\>\>.constructor

• **new TwoLevelMap**<`K1`, `K2`, `V`\>(`iterable?`)

#### Type parameters

| Name |
| :------ |
| `K1` |
| `K2` |
| `V` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `iterable?` | ``null`` \| `Iterable`<readonly [`K1`, `Map`<`K2`, `V`\>]\> |

#### Inherited from

Map<K1, Map<K2, V\>\>.constructor

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

___

### [species]

▪ `Static` `Readonly` **[species]**: `MapConstructor`

#### Inherited from

Map.[species]

## Methods

### [iterator]

▸ **[iterator]**(): `IterableIterator`<[`K1`, `Map`<`K2`, `V`\>]\>

Returns an iterable of entries in the map.

#### Returns

`IterableIterator`<[`K1`, `Map`<`K2`, `V`\>]\>

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
| `key` | `K1` |

#### Returns

`boolean`

true if an element in the Map existed and has been removed, or false if the element does not exist.

#### Inherited from

Map.delete

___

### entries

▸ **entries**(): `IterableIterator`<[`K1`, `Map`<`K2`, `V`\>]\>

Returns an iterable of key, value pairs for every entry in the map.

#### Returns

`IterableIterator`<[`K1`, `Map`<`K2`, `V`\>]\>

#### Inherited from

Map.entries

___

### forEach

▸ **forEach**(`callbackfn`, `thisArg?`): `void`

Executes a provided function once per each key/value pair in the Map, in insertion order.

#### Parameters

| Name | Type |
| :------ | :------ |
| `callbackfn` | (`value`: `Map`<`K2`, `V`\>, `key`: `K1`, `map`: `Map`<`K1`, `Map`<`K2`, `V`\>\>) => `void` |
| `thisArg?` | `any` |

#### Returns

`void`

#### Inherited from

Map.forEach

___

### get

▸ **get**(`key`): `undefined` \| `Map`<`K2`, `V`\>

Returns a specified element from the Map object. If the value that is associated to the provided key is an object, then you will get a reference to that object and any change made to that object will effectively modify it inside the Map.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K1` |

#### Returns

`undefined` \| `Map`<`K2`, `V`\>

Returns the element associated with the specified key. If no element is associated with the specified key, undefined is returned.

#### Inherited from

Map.get

___

### getOrAdd

▸ **getOrAdd**(`key1`, `key2`, `create`, `sentinel?`): `V`

Get an existing entry in the map or add a new one if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key1` | `K1` | The first key |
| `key2` | `K2` | The second key |
| `create` | () => `V` | A callback to create the new entry when not found. |
| `sentinel?` | `V` | An optional sentinel value to use to indicate that the entry is being created. |

#### Returns

`V`

___

### has

▸ **has**(`key`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K1` |

#### Returns

`boolean`

boolean indicating whether an element with the specified key exists or not.

#### Inherited from

Map.has

___

### keys

▸ **keys**(): `IterableIterator`<`K1`\>

Returns an iterable of keys in the map

#### Returns

`IterableIterator`<`K1`\>

#### Inherited from

Map.keys

___

### set

▸ **set**(`key`, `value`): [`TwoLevelMap`](TwoLevelMap.md)<`K1`, `K2`, `V`\>

Adds a new element with a specified key and value to the Map. If an element with the same key already exists, the element will be updated.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K1` |
| `value` | `Map`<`K2`, `V`\> |

#### Returns

[`TwoLevelMap`](TwoLevelMap.md)<`K1`, `K2`, `V`\>

#### Inherited from

Map.set

___

### values

▸ **values**(): `IterableIterator`<`Map`<`K2`, `V`\>\>

Returns an iterable of values in the map

#### Returns

`IterableIterator`<`Map`<`K2`, `V`\>\>

#### Inherited from

Map.values
