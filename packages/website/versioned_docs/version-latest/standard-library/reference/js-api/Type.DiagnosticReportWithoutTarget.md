---
jsApi: true
title: "[T] DiagnosticReportWithoutTarget"

---
```ts
DiagnosticReportWithoutTarget: <T, C, M> {code: C; messageId: M;} & DiagnosticFormat< T, C, M >
```

| Member | Type |
| :------ | :------ |
| `code` | `C` |
| `messageId`? | `M` |

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` *extends* \{} | - |
| `C` *extends* *keyof* `T` | - |
| `M` *extends* *keyof* `T`[`C`] | `"default"` |
