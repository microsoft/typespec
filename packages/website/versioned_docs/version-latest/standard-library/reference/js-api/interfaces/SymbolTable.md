[JS Api](../index.md) / SymbolTable

# Interface: SymbolTable

## Hierarchy

- `ReadonlyMap`<`string`, [`Sym`](Sym.md)\>

  ↳ **`SymbolTable`**

## Table of contents

### Properties

- [duplicates](SymbolTable.md#duplicates)
- [size](SymbolTable.md#size)

### Methods

- [[iterator]](SymbolTable.md#[iterator])
- [entries](SymbolTable.md#entries)
- [forEach](SymbolTable.md#foreach)
- [get](SymbolTable.md#get)
- [has](SymbolTable.md#has)
- [keys](SymbolTable.md#keys)
- [values](SymbolTable.md#values)

## Properties

### duplicates

• `Readonly` **duplicates**: `ReadonlyMap`<[`Sym`](Sym.md), `ReadonlySet`<[`Sym`](Sym.md)\>\>

Duplicate

___

### size

• `Readonly` **size**: `number`

#### Inherited from

ReadonlyMap.size

## Methods

### [iterator]

▸ **[iterator]**(): `IterableIterator`<[`string`, [`Sym`](Sym.md)]\>

Returns an iterable of entries in the map.

#### Returns

`IterableIterator`<[`string`, [`Sym`](Sym.md)]\>

#### Inherited from

ReadonlyMap.[iterator]

___

### entries

▸ **entries**(): `IterableIterator`<[`string`, [`Sym`](Sym.md)]\>

Returns an iterable of key, value pairs for every entry in the map.

#### Returns

`IterableIterator`<[`string`, [`Sym`](Sym.md)]\>

#### Inherited from

ReadonlyMap.entries

___

### forEach

▸ **forEach**(`callbackfn`, `thisArg?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callbackfn` | (`value`: [`Sym`](Sym.md), `key`: `string`, `map`: `ReadonlyMap`<`string`, [`Sym`](Sym.md)\>) => `void` |
| `thisArg?` | `any` |

#### Returns

`void`

#### Inherited from

ReadonlyMap.forEach

___

### get

▸ **get**(`key`): `undefined` \| [`Sym`](Sym.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`undefined` \| [`Sym`](Sym.md)

#### Inherited from

ReadonlyMap.get

___

### has

▸ **has**(`key`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`boolean`

#### Inherited from

ReadonlyMap.has

___

### keys

▸ **keys**(): `IterableIterator`<`string`\>

Returns an iterable of keys in the map

#### Returns

`IterableIterator`<`string`\>

#### Inherited from

ReadonlyMap.keys

___

### values

▸ **values**(): `IterableIterator`<[`Sym`](Sym.md)\>

Returns an iterable of values in the map

#### Returns

`IterableIterator`<[`Sym`](Sym.md)\>

#### Inherited from

ReadonlyMap.values
