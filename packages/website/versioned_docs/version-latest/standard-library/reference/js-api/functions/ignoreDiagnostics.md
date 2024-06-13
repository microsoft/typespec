---
jsApi: true
title: "[F] ignoreDiagnostics"

---
```ts
function ignoreDiagnostics<T>(result): T
```

Ignore the diagnostics emitted by the diagnostic accessor pattern and just return the actual result.

## Type parameters

| Type parameter |
| :------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `result` | [`DiagnosticResult`](../type-aliases/DiagnosticResult.md)<`T`\> | Accessor pattern tuple result including the actual result and the list of diagnostics. |

## Returns

`T`

Actual result.
