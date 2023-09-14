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

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |
| `parentSegments` | `string`[] |
| `overloadBase` | `undefined` \| [`HttpOperation`](Interface.HttpOperation.md) |
| `options` | [`RouteOptions`](Interface.RouteOptions.md) |

## Returns

`DiagnosticResult`< [`RouteProducerResult`](Interface.RouteProducerResult.md) \>
