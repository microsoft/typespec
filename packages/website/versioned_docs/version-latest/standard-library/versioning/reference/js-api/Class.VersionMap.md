---
jsApi: true
title: "[C] VersionMap"

---
## Constructors

### new VersionMap

```ts
new VersionMap(namespace, enumType): VersionMap
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `namespace` | `Namespace` |
| `enumType` | `Enum` |

#### Returns

[`VersionMap`](Class.VersionMap.md)

## Properties

| Property | Type |
| :------ | :------ |
| `private` `map` | `Map`< `EnumMember`, [`Version`](Interface.Version.md) \> |

## Accessors

### size

```ts
get size(): number
```

## Methods

### getVersionForEnumMember

```ts
getVersionForEnumMember(member): undefined | Version
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `member` | `EnumMember` |

#### Returns

`undefined` \| [`Version`](Interface.Version.md)

***

### getVersions

```ts
getVersions(): Version[]
```

#### Returns

[`Version`](Interface.Version.md)[]
