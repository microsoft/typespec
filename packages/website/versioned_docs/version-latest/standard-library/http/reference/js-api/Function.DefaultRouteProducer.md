---
jsApi: true
title: "[F] DefaultRouteProducer"
---

```ts
DefaultRouteProducer(
  program,
  operation,
  parentSegments,
  overloadBase,
  options): DiagnosticResult< RouteProducerResult >
```

## Parameters

| Parameter        | Type                                                         |
| :--------------- | :----------------------------------------------------------- |
| `program`        | `Program`                                                    |
| `operation`      | `Operation`                                                  |
| `parentSegments` | `string`[]                                                   |
| `overloadBase`   | `undefined` \| [`HttpOperation`](Interface.HttpOperation.md) |
| `options`        | [`RouteOptions`](Interface.RouteOptions.md)                  |

## Returns

`DiagnosticResult`< [`RouteProducerResult`](Interface.RouteProducerResult.md) \>

## Source

[route.ts:155](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/http/src/route.ts#L155)
