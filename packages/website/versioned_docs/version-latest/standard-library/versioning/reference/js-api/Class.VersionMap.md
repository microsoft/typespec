---
jsApi: true
title: "[C] VersionMap"
---

## Constructors

### constructor()

```ts
new VersionMap(namespace, enumType): VersionMap
```

#### Parameters

| Parameter   | Type        |
| :---------- | :---------- |
| `namespace` | `Namespace` |
| `enumType`  | `Enum`      |

#### Returns

[`VersionMap`](Class.VersionMap.md)

#### Source

[versioning/src/versioning.ts:266](https://github.com/markcowl/cadl/blob/3db15286/packages/versioning/src/versioning.ts#L266)

## Properties

| Property        | Type                                                      |
| :-------------- | :-------------------------------------------------------- |
| `private` `map` | `Map`< `EnumMember`, [`Version`](Interface.Version.md) \> |

## Accessors

### size

```ts
get size(): number
```

#### Source

[versioning/src/versioning.ts:288](https://github.com/markcowl/cadl/blob/3db15286/packages/versioning/src/versioning.ts#L288)

## Methods

### getVersionForEnumMember()

```ts
getVersionForEnumMember(member): undefined | Version
```

#### Parameters

| Parameter | Type         |
| :-------- | :----------- |
| `member`  | `EnumMember` |

#### Returns

`undefined` \| [`Version`](Interface.Version.md)

#### Source

[versioning/src/versioning.ts:280](https://github.com/markcowl/cadl/blob/3db15286/packages/versioning/src/versioning.ts#L280)

---

### getVersions()

```ts
getVersions(): Version[]
```

#### Returns

[`Version`](Interface.Version.md)[]

#### Source

[versioning/src/versioning.ts:284](https://github.com/markcowl/cadl/blob/3db15286/packages/versioning/src/versioning.ts#L284)
