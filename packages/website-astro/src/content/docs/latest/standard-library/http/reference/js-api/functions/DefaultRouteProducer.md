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
options): DiagnosticResult<RouteProducerResult>
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |
| `parentSegments` | `string`[] |
| `overloadBase` | `undefined` \| [`HttpOperation`](../interfaces/HttpOperation.md) |
| `options` | [`RouteOptions`](../interfaces/RouteOptions.md) |
