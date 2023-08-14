---
jsApi: true
title: "[F] getTypeChangedFrom"
---

```ts
getTypeChangedFrom(p, t): Map< Version, Type > | undefined
```

Returns the mapping of versions to old type values, if applicable

## Parameters

| Parameter | Type      | Description      |
| :-------- | :-------- | :--------------- |
| `p`       | `Program` | TypeSpec program |
| `t`       | `Type`    | type to query    |

## Returns

`Map`< [`Version`](Interface.Version.md), `Type` \> \| `undefined`

Map of versions to old types, if any

## Source

[versioning/src/versioning.ts:89](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/versioning/src/versioning.ts#L89)
