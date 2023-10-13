---
jsApi: true
title: "[T] DiagnosticReport"

---
```ts
type DiagnosticReport<T, C, M>: DiagnosticReportWithoutTarget<T, C, M> & object;
```

## Type declaration

| Member | Type | Description |
| :------ | :------ | :------ |
| `target` | [`DiagnosticTarget`](DiagnosticTarget.md) \| *typeof* [`NoTarget`](../variables/NoTarget.md) | - |

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` extends `object` | - |
| `C` extends keyof `T` | - |
| `M` extends keyof `T`[`C`] | `"default"` |
