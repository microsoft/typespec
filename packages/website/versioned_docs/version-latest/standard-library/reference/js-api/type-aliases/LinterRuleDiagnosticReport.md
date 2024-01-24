---
jsApi: true
title: "[T] LinterRuleDiagnosticReport"

---
```ts
type LinterRuleDiagnosticReport<T, M>: LinterRuleDiagnosticReportWithoutTarget<T, M> & Object;
```

## Type declaration

| Member | Type | Description |
| :------ | :------ | :------ |
| `target` | [`DiagnosticTarget`](DiagnosticTarget.md) \| *typeof* [`NoTarget`](../variables/NoTarget.md) | - |

## Type parameters

| Parameter | Value |
| :------ | :------ |
| `T` extends [`DiagnosticMessages`](../interfaces/DiagnosticMessages.md) | - |
| `M` extends keyof `T` | `"default"` |
