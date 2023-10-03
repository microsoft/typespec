---
jsApi: true
title: "[T] LinterRuleDiagnosticReportWithoutTarget"

---
```ts
LinterRuleDiagnosticReportWithoutTarget: <T, M> {messageId: M;} & LinterRuleDiagnosticFormat< T, M >
```

| Member | Type |
| :------ | :------ |
| `messageId`? | `M` |

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` *extends* [`DiagnosticMessages`](Interface.DiagnosticMessages.md) | - |
| `M` *extends* *keyof* `T` | `"default"` |
