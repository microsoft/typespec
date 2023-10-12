---
jsApi: true
title: "[T] DiagnosticReportWithoutTarget"

---
```ts
type DiagnosticReportWithoutTarget<T, C, M>: object & DiagnosticFormat<T, C, M>;
```

## Type declaration

| Member | Type | Description |
| :------ | :------ | :------ |
| `code` | `C` | - |
| `messageId` | `M` | - |

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` extends `object` | - |
| `C` extends keyof `T` | - |
| `M` extends keyof `T`[`C`] | `"default"` |
