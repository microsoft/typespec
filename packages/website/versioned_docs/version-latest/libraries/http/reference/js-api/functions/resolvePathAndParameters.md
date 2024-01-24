---
jsApi: true
title: "[F] resolvePathAndParameters"

---
```ts
resolvePathAndParameters(
   program, 
   operation, 
   overloadBase, 
options): DiagnosticResult<Object>
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |
| `overloadBase` | `undefined` \| [`HttpOperation`](../interfaces/HttpOperation.md) |
| `options` | [`RouteResolutionOptions`](../interfaces/RouteResolutionOptions.md) |

## Returns

`DiagnosticResult`<`Object`\>

> | Member | Type | Description |
> | :------ | :------ | :------ |
> | `parameters` | [`HttpOperationParameters`](../interfaces/HttpOperationParameters.md) | - |
> | `path` | `string` | - |
> | `pathSegments` | `string`[] | - |
>
