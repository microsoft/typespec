---
jsApi: true
title: "[T] DiagnosticReportWithoutTarget"

---
```ts
type DiagnosticReportWithoutTarget<T, C, M>: object & DiagnosticFormat<T, C, M>;
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
| `T` *extends* `object` | - |
| `C` *extends* keyof `T` | - |
| `M` *extends* keyof `T`\[`C`\] | `"default"` |
