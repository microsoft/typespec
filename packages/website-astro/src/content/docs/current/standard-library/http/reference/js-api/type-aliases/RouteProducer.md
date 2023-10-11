---
jsApi: true
title: "[T] RouteProducer"

---
```ts
type RouteProducer: (program, operation, parentSegments, overloadBase, options) => DiagnosticResult<RouteProducerResult>;
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |
| `parentSegments` | `string`[] |
| `overloadBase` | [`HttpOperation`](../interfaces/HttpOperation.md) \| `undefined` |
| `options` | [`RouteOptions`](../interfaces/RouteOptions.md) |
