---
jsApi: true
title: "[T] LinterRuleDiagnosticReportWithoutTarget"

---
```ts
type LinterRuleDiagnosticReportWithoutTarget<T, M>: object & LinterRuleDiagnosticFormat<T, M>;
```

## Type declaration

| Member | Type |
| :------ | :------ |
| `codefixes` | [`CodeFix`](../interfaces/CodeFix.md)[] |
| `messageId` | `M` |

## Type parameters

| Type parameter | Value |
| :------ | :------ |
| `T` *extends* [`DiagnosticMessages`](../interfaces/DiagnosticMessages.md) | - |
| `M` *extends* keyof `T` | `"default"` |
