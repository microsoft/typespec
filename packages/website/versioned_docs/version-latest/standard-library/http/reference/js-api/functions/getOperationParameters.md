---
jsApi: true
title: "[F] getOperationParameters"

---
```ts
getOperationParameters(
   program, 
   operation, 
   overloadBase?, 
   knownPathParamNames?, 
   options?): [HttpOperationParameters, readonly Diagnostic[]]
```

## Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `program` | `Program` | `undefined` |
| `operation` | `Operation` | `undefined` |
| `overloadBase`? | [`HttpOperation`](../interfaces/HttpOperation.md) | `undefined` |
| `knownPathParamNames`? | `string`[] | `[]` |
| `options`? | [`OperationParameterOptions`](../interfaces/OperationParameterOptions.md) | `{}` |
