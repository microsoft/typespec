---
jsApi: true
title: "[C] VersionMap"

---
## Constructors

### new VersionMap()

```ts
new VersionMap(namespace, enumType): VersionMap
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `namespace` | `Namespace` |
| `enumType` | `Enum` |

#### Returns

[`VersionMap`](VersionMap.md)

## Properties

| Property | Modifier | Type | Default value |
| :------ | :------ | :------ | :------ |
| `map` | `private` | `Map`<`EnumMember`, [`Version`](../interfaces/Version.md)\> | `...` |

## Accessors

### size

```ts
get size(): number
```

#### Returns

`number`

## Methods

### getVersionForEnumMember()

```ts
getVersionForEnumMember(member): undefined | Version
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `member` | `EnumMember` |

#### Returns

`undefined` \| [`Version`](../interfaces/Version.md)

***

### getVersions()

```ts
getVersions(): Version[]
```

#### Returns

[`Version`](../interfaces/Version.md)[]
