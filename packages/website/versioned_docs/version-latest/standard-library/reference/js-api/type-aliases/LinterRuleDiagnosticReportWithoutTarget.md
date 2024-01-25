---
jsApi: true
title: "[T] LinterRuleDiagnosticReportWithoutTarget"

---
```ts
type LinterRuleDiagnosticReportWithoutTarget<T, M>: Object & LinterRuleDiagnosticFormat<T, M>;
```

## Type declaration

| Member | Type | Description |
| :------ | :------ | :------ |
| `messageId` | `M` | - |

## Type parameters

| Parameter | Value |
| :------ | :------ |
| `T` extends [`DiagnosticMessages`](../interfaces/DiagnosticMessages.md) | - |
| `M` extends keyof `T` | `"default"` |
