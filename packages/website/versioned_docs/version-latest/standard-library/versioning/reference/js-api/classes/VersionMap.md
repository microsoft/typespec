[JS Api](../index.md) / VersionMap

# Class: VersionMap

## Table of contents

### Constructors

- [constructor](VersionMap.md#constructor)

### Properties

- [map](VersionMap.md#map)

### Accessors

- [size](VersionMap.md#size)

### Methods

- [getVersionForEnumMember](VersionMap.md#getversionforenummember)
- [getVersions](VersionMap.md#getversions)

## Constructors

### constructor

• **new VersionMap**(`namespace`, `enumType`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `namespace` | `Namespace` |
| `enumType` | `Enum` |

## Properties

### map

• `Private` **map**: `Map`<`EnumMember`, [`Version`](../interfaces/Version.md)\>

## Accessors

### size

• `get` **size**(): `number`

#### Returns

`number`

## Methods

### getVersionForEnumMember

▸ **getVersionForEnumMember**(`member`): `undefined` \| [`Version`](../interfaces/Version.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `member` | `EnumMember` |

#### Returns

`undefined` \| [`Version`](../interfaces/Version.md)

___

### getVersions

▸ **getVersions**(): [`Version`](../interfaces/Version.md)[]

#### Returns

[`Version`](../interfaces/Version.md)[]
