---
jsApi: true
title: "[F] resolvePathAndParameters"

---
```ts
resolvePathAndParameters(
  program,
  operation,
  overloadBase,
  options): DiagnosticResult< {parameters: HttpOperationParameters; path: string; pathSegments: string[];} >
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |
| `overloadBase` | `undefined` \| [`HttpOperation`](Interface.HttpOperation.md) |
| `options` | [`RouteResolutionOptions`](Interface.RouteResolutionOptions.md) |

## Returns

`DiagnosticResult`< \{`parameters`: [`HttpOperationParameters`](Interface.HttpOperationParameters.md); `path`: `string`; `pathSegments`: `string`[];} \>
