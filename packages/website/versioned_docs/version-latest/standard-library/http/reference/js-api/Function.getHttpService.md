---
jsApi: true
title: "[F] getHttpService"
---

```ts
getHttpService(
  program,
  serviceNamespace,
  options?): [HttpService, readonly Diagnostic[]]
```

## Parameters

| Parameter          | Type                                                            |
| :----------------- | :-------------------------------------------------------------- |
| `program`          | `Program`                                                       |
| `serviceNamespace` | `Namespace`                                                     |
| `options`?         | [`RouteResolutionOptions`](Interface.RouteResolutionOptions.md) |

## Returns

[[`HttpService`](Interface.HttpService.md), *readonly* `Diagnostic`[]]

## Source

[operations.ts:84](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/http/src/operations.ts#L84)
