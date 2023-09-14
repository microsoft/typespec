---
jsApi: true
title: "[T] LinterRuleDiagnosticReport"

---
```ts
LinterRuleDiagnosticReport: <T, M> LinterRuleDiagnosticReportWithoutTarget< T, M > & {target: DiagnosticTarget | typeof NoTarget;}
```

| Member | Type |
| :------ | :------ |
| `target` | [`DiagnosticTarget`](Type.DiagnosticTarget.md) \| *typeof* [`NoTarget`](Variable.NoTarget.md) |

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` *extends* [`DiagnosticMessages`](Interface.DiagnosticMessages.md) | - |
| `M` *extends* *keyof* `T` | `"default"` |
