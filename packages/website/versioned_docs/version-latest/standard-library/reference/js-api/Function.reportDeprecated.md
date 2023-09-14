---
jsApi: true
title: "[F] reportDeprecated"

---
```ts
reportDeprecated(
  program,
  message,
  target): void
```

Report a deprecated diagnostic.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](Interface.Program.md) | TypeSpec Program. |
| `message` | `string` | Message describing the deprecation. |
| `target` | [`DiagnosticTarget`](Type.DiagnosticTarget.md) \| *typeof* [`NoTarget`](Variable.NoTarget.md) | Target of the deprecation. |

## Returns

`void`
