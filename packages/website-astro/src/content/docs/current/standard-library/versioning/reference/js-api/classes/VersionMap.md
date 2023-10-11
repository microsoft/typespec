---
jsApi: true
title: "[C] VersionMap"

---
## Constructors

### new VersionMap(namespace, enumType)

```ts
new VersionMap(namespace, enumType): VersionMap
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `namespace` | `Namespace` |
| `enumType` | `Enum` |

## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `private` | `map` | `Map`<`EnumMember`, [`Version`](../interfaces/Version.md)\> | - |

## Accessors

### size

```ts
get size(): number
```

## Methods

### getVersionForEnumMember()

```ts
getVersionForEnumMember(member): undefined | Version
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `member` | `EnumMember` |

***

### getVersions()

```ts
getVersions(): Version[]
```
