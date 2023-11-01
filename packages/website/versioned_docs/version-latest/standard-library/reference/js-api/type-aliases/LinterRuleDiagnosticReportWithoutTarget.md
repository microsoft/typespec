---
jsApi: true
title: "[T] LinterRuleDiagnosticReportWithoutTarget"

---
```ts
type LinterRuleDiagnosticReportWithoutTarget<T, M>: object & LinterRuleDiagnosticFormat<T, M>;
```

## Type declaration

| Member | Type | Description |
| :------ | :------ | :------ |
| `messageId` | `M` | - |

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` extends [`DiagnosticMessages`](../interfaces/DiagnosticMessages.md) | - |
| `M` extends keyof `T` | `"default"` |
