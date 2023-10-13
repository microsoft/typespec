---
jsApi: true
title: "[F] getTypeChangedFrom"

---
```ts
getTypeChangedFrom(p, t): Map<Version, Type> | undefined
```

Returns the mapping of versions to old type values, if applicable

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `p` | `Program` | TypeSpec program |
| `t` | `Type` | type to query |

## Returns

Map of versions to old types, if any
