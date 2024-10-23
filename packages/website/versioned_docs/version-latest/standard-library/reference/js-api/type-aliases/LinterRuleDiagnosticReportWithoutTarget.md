---
jsApi: true
title: "[T] LinterRuleDiagnosticReportWithoutTarget"

---
```ts
type LinterRuleDiagnosticReportWithoutTarget<T, M>: object & LinterRuleDiagnosticFormat<T, M>;
```

## Type declaration

| Name | Type |
| ------ | ------ |
| `codefixes`? | [`CodeFix`](../interfaces/CodeFix.md)[] |
| `messageId`? | `M` |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`DiagnosticMessages`](../interfaces/DiagnosticMessages.md) | - |
| `M` *extends* keyof `T` | `"default"` |
