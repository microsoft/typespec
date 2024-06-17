---
jsApi: true
title: "[T] LinterRuleDiagnosticReport"

---
```ts
type LinterRuleDiagnosticReport<T, M>: LinterRuleDiagnosticReportWithoutTarget<T, M> & object;
```

## Type declaration

| Member | Type |
| :------ | :------ |
| `target` | [`DiagnosticTarget`](DiagnosticTarget.md) \| *typeof* [`NoTarget`](../variables/NoTarget.md) |

## Type parameters

| Type parameter | Value |
| :------ | :------ |
| `T` *extends* [`DiagnosticMessages`](../interfaces/DiagnosticMessages.md) | - |
| `M` *extends* keyof `T` | `"default"` |
