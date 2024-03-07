---
jsApi: true
title: "[T] DiagnosticReport"

---
```ts
type DiagnosticReport<T, C, M>: DiagnosticReportWithoutTarget<T, C, M> & Object;
```

## Type declaration

| Member | Type |
| :------ | :------ |
| `target` | [`DiagnosticTarget`](DiagnosticTarget.md) \| *typeof* [`NoTarget`](../variables/NoTarget.md) |

## Type parameters

| Type parameter | Value |
| :------ | :------ |
| `T` extends `Object` | - |
| `C` extends keyof `T` | - |
| `M` extends keyof `T`\[`C`\] | `"default"` |
