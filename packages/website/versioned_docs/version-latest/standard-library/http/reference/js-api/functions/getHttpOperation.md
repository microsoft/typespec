---
jsApi: true
title: "[F] getHttpOperation"

---
```ts
getHttpOperation(
   program, 
   operation, 
   options?): [HttpOperation, readonly Diagnostic[]]
```

Return the Http Operation details for a given TypeSpec operation.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | - |
| `operation` | `Operation` | Operation |
| `options`? | [`RouteResolutionOptions`](../interfaces/RouteResolutionOptions.md) | Optional option on how to resolve the http details. |
