---
jsApi: true
title: "[F] listHttpOperationsIn"

---
```ts
listHttpOperationsIn(
  program,
  container,
  options?): [HttpOperation[], readonly Diagnostic[]]
```

Get all the Http Operation in the given container.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | Program |
| `container` | [`OperationContainer`](Type.OperationContainer.md) | Namespace or interface containing operations |
| `options`? | [`RouteResolutionOptions`](Interface.RouteResolutionOptions.md) | Resolution options |

## Returns

[[`HttpOperation`](Interface.HttpOperation.md)[], *readonly* `Diagnostic`[]]
