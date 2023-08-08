---
jsApi: true
title: "[F] getUseDependencies"
---

```ts
getUseDependencies(
  program,
  target,
  searchEnum = true): Map< Namespace, Map< Version, Version > | Version > | undefined
```

## Parameters

| Parameter    | Type                  | Default value |
| :----------- | :-------------------- | :------------ |
| `program`    | `Program`             | `undefined`   |
| `target`     | `Enum` \| `Namespace` | `undefined`   |
| `searchEnum` | `boolean`             | `true`        |

## Returns

`Map`< `Namespace`, `Map`< [`Version`](Interface.Version.md), [`Version`](Interface.Version.md) \> \| [`Version`](Interface.Version.md) \> \| `undefined`

## Source

[versioning/src/versioning.ts:359](https://github.com/markcowl/cadl/blob/3db15286/packages/versioning/src/versioning.ts#L359)
