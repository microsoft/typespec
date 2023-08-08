---
jsApi: true
title: "[F] getAllRoutes"
---

```ts
getAllRoutes(program, options?): [HttpOperation[], readonly Diagnostic[]]
```

## Deprecated

use `getAllHttpServices` or `resolveHttpOperations` manually

## Parameters

| Parameter  | Type                                                            |
| :--------- | :-------------------------------------------------------------- |
| `program`  | `Program`                                                       |
| `options`? | [`RouteResolutionOptions`](Interface.RouteResolutionOptions.md) |

## Returns

[[`HttpOperation`](Interface.HttpOperation.md)[], *readonly* `Diagnostic`[]]

## Source

[operations.ts:112](https://github.com/markcowl/cadl/blob/3db15286/packages/http/src/operations.ts#L112)
