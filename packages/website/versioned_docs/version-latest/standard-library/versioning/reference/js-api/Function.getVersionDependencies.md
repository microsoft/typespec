---
jsApi: true
title: "[F] getVersionDependencies"
---

```ts
getVersionDependencies(program, namespace): Map< Namespace, Map< Version, Version > | Version > | undefined
```

## Parameters

| Parameter   | Type        |
| :---------- | :---------- |
| `program`   | `Program`   |
| `namespace` | `Namespace` |

## Returns

`Map`< `Namespace`, `Map`< [`Version`](Interface.Version.md), [`Version`](Interface.Version.md) \> \| [`Version`](Interface.Version.md) \> \| `undefined`

## Source

[versioning/src/versioning.ts:433](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/versioning/src/versioning.ts#L433)
