---
jsApi: true
title: "[F] resolvePathAndParameters"

---
```ts
function resolvePathAndParameters(
   program, 
   operation, 
   overloadBase, 
options): DiagnosticResult<object>
```

## Parameters

| Parameter | Type |
| ------ | ------ |
| `program` | `Program` |
| `operation` | `Operation` |
| `overloadBase` | `undefined` \| [`HttpOperation`](../interfaces/HttpOperation.md) |
| `options` | [`RouteResolutionOptions`](../interfaces/RouteResolutionOptions.md) |

## Returns

`DiagnosticResult`<`object`\>

| Name | Type |
| ------ | ------ |
| `parameters` | [`HttpOperationParameters`](../interfaces/HttpOperationParameters.md) |
| `path` | `string` |
| `uriTemplate` | `string` |
