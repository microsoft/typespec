---
jsApi: true
title: "[T] DiagnosticReportWithoutTarget"

---
```ts
type DiagnosticReportWithoutTarget<T, C, M>: Object & DiagnosticFormat<T, C, M>;
```

## Type declaration

| Member | Type | Description |
| :------ | :------ | :------ |
| `code` | `C` | - |
| `messageId` | `M` | - |

## Type parameters

| Parameter | Value |
| :------ | :------ |
| `T` extends `Object` | - |
| `C` extends keyof `T` | - |
| `M` extends keyof `T`\[`C`\] | `"default"` |
