---
jsApi: true
title: "[F] getAllHttpServices"
---

```ts
getAllHttpServices(program, options?): [HttpService[], readonly Diagnostic[]]
```

Returns all the services defined.

## Parameters

| Parameter  | Type                                                            |
| :--------- | :-------------------------------------------------------------- |
| `program`  | `Program`                                                       |
| `options`? | [`RouteResolutionOptions`](Interface.RouteResolutionOptions.md) |

## Returns

[[`HttpService`](Interface.HttpService.md)[], *readonly* `Diagnostic`[]]

## Source

[operations.ts:66](https://github.com/markcowl/cadl/blob/3db15286/packages/http/src/operations.ts#L66)
