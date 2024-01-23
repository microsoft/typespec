---
jsApi: true
title: "[T] DiagnosticReport"

---
```ts
type DiagnosticReport<T, C, M>: DiagnosticReportWithoutTarget<T, C, M> & Object;
```

## Type declaration

| Member | Type | Description |
| :------ | :------ | :------ |
| `target` | [`DiagnosticTarget`](DiagnosticTarget.md) \| *typeof* [`NoTarget`](../variables/NoTarget.md) | - |

## Type parameters

| Parameter | Value |
| :------ | :------ |
| `T` extends `Object` | - |
| `C` extends keyof `T` | - |
| `M` extends keyof `T`\[`C`\] | `"default"` |
