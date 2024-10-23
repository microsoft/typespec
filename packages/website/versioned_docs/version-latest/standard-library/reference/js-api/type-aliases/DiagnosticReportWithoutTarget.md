---
jsApi: true
title: "[T] DiagnosticReportWithoutTarget"

---
```ts
type DiagnosticReportWithoutTarget<T, C, M>: object & DiagnosticFormat<T, C, M>;
```

## Type declaration

| Name | Type |
| ------ | ------ |
| `code` | `C` |
| `codefixes`? | readonly [`CodeFix`](../interfaces/CodeFix.md)[] |
| `messageId`? | `M` |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `object` | - |
| `C` *extends* keyof `T` | - |
| `M` *extends* keyof `T`\[`C`\] | `"default"` |
