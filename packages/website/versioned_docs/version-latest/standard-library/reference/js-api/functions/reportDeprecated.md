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
| `program` | [`Program`](../interfaces/Program.md) | TypeSpec Program. |
| `message` | `string` | Message describing the deprecation. |
| `target` | [`DiagnosticTarget`](../type-aliases/DiagnosticTarget.md) \| *typeof* [`NoTarget`](../variables/NoTarget.md) | Target of the deprecation. |
