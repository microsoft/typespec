---
jsApi: true
title: "[T] DiagnosticReport"

---
```ts
type DiagnosticReport<T, C, M>: DiagnosticReportWithoutTarget<T, C, M> & object;
```

## Type declaration

| Name | Type |
| ------ | ------ |
| `target` | [`DiagnosticTarget`](DiagnosticTarget.md) \| *typeof* [`NoTarget`](../variables/NoTarget.md) |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `object` | - |
| `C` *extends* keyof `T` | - |
| `M` *extends* keyof `T`\[`C`\] | `"default"` |
