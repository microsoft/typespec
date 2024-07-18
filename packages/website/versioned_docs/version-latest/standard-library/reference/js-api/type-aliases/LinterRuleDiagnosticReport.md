---
jsApi: true
title: "[T] LinterRuleDiagnosticReport"

---
```ts
type LinterRuleDiagnosticReport<T, M>: LinterRuleDiagnosticReportWithoutTarget<T, M> & object;
```

## Type declaration

| Name | Type |
| ------ | ------ |
| `target` | [`DiagnosticTarget`](DiagnosticTarget.md) \| *typeof* [`NoTarget`](../variables/NoTarget.md) |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`DiagnosticMessages`](../interfaces/DiagnosticMessages.md) | - |
| `M` *extends* keyof `T` | `"default"` |
