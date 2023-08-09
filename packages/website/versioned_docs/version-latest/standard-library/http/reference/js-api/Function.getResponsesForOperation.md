---
jsApi: true
title: "[F] getResponsesForOperation"
---

```ts
getResponsesForOperation(program, operation): [HttpOperationResponse[], readonly Diagnostic[]]
```

Get the responses for a given operation.

## Parameters

| Parameter   | Type        |
| :---------- | :---------- |
| `program`   | `Program`   |
| `operation` | `Operation` |

## Returns

[[`HttpOperationResponse`](Interface.HttpOperationResponse.md)[], *readonly* `Diagnostic`[]]

## Source

[responses.ts:33](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/http/src/responses.ts#L33)
