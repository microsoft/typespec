---
jsApi: true
title: "[T] DiagnosticReportWithoutTarget"

---
```ts
type DiagnosticReportWithoutTarget<T, C, M>: Object & DiagnosticFormat<T, C, M>;
```

## Type declaration

| Member | Type |
| :------ | :------ |
| `code` | `C` |
| `codefixes` | readonly [`CodeFix`](../interfaces/CodeFix.md)[] |
| `messageId` | `M` |

## Type parameters

| Type parameter | Value |
| :------ | :------ |
| `T` extends `Object` | - |
| `C` extends keyof `T` | - |
| `M` extends keyof `T`\[`C`\] | `"default"` |
