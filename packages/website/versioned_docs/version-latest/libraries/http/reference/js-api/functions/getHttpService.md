---
jsApi: true
title: "[F] getHttpService"

---
```ts
function getHttpService(
   program, 
   serviceNamespace, 
   options?): [HttpService, readonly Diagnostic[]]
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `serviceNamespace` | `Namespace` |
| `options`? | [`RouteResolutionOptions`](../interfaces/RouteResolutionOptions.md) |

## Returns

[[`HttpService`](../interfaces/HttpService.md), readonly `Diagnostic`[]]
