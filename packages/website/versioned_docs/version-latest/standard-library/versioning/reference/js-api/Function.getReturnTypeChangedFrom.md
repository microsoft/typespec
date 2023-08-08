---
jsApi: true
title: "[F] getReturnTypeChangedFrom"
---

```ts
getReturnTypeChangedFrom(p, t): Map< Version, Type > | undefined
```

Returns the mapping of versions to old return type values, if applicable

## Parameters

| Parameter | Type      | Description      |
| :-------- | :-------- | :--------------- |
| `p`       | `Program` | TypeSpec program |
| `t`       | `Type`    | type to query    |

## Returns

`Map`< [`Version`](Interface.Version.md), `Type` \> \| `undefined`

Map of versions to old types, if any

## Source

[versioning/src/versioning.ts:120](https://github.com/markcowl/cadl/blob/3db15286/packages/versioning/src/versioning.ts#L120)
