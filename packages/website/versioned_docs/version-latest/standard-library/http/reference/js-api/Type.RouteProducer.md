---
jsApi: true
title: "[T] RouteProducer"
---

```ts
RouteProducer: (program, operation, parentSegments, overloadBase, options) =>
  DiagnosticResult<RouteProducerResult>;
```

## Parameters

| Parameter        | Type                                                         |
| :--------------- | :----------------------------------------------------------- |
| `program`        | `Program`                                                    |
| `operation`      | `Operation`                                                  |
| `parentSegments` | `string`[]                                                   |
| `overloadBase`   | [`HttpOperation`](Interface.HttpOperation.md) \| `undefined` |
| `options`        | [`RouteOptions`](Interface.RouteOptions.md)                  |

## Returns

`DiagnosticResult`< [`RouteProducerResult`](Interface.RouteProducerResult.md) \>

## Source

[types.ts:198](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/http/src/types.ts#L198)
