---
jsApi: true
title: "[T] DiagnosticReport"

---
```ts
DiagnosticReport: <T, C, M> DiagnosticReportWithoutTarget< T, C, M > & {target: DiagnosticTarget | typeof NoTarget;}
```

| Member | Type |
| :------ | :------ |
| `target` | [`DiagnosticTarget`](Type.DiagnosticTarget.md) \| *typeof* [`NoTarget`](Variable.NoTarget.md) |

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` *extends* \{} | - |
| `C` *extends* *keyof* `T` | - |
| `M` *extends* *keyof* `T`[`C`] | `"default"` |
