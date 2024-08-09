---
jsApi: true
title: "[F] getOperationParameters"

---
```ts
function getOperationParameters(
   program, 
   operation, 
   partialUriTemplate, 
   overloadBase?, 
   options?): [HttpOperationParameters, readonly Diagnostic[]]
```

## Parameters

| Parameter | Type |
| ------ | ------ |
| `program` | `Program` |
| `operation` | `Operation` |
| `partialUriTemplate` | `string` |
| `overloadBase`? | [`HttpOperation`](../interfaces/HttpOperation.md) |
| `options`? | [`OperationParameterOptions`](../interfaces/OperationParameterOptions.md) |

## Returns

[[`HttpOperationParameters`](../interfaces/HttpOperationParameters.md), readonly `Diagnostic`[]]
