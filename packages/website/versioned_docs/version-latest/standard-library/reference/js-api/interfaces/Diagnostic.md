---
jsApi: true
title: "[I] Diagnostic"

---
## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| `code` | `public` | `string` |
| `codefixes?` | `readonly` | readonly [`CodeFix`](CodeFix.md)[] |
| `message` | `public` | `string` |
| `severity` | `public` | [`DiagnosticSeverity`](../type-aliases/DiagnosticSeverity.md) |
| `target` | `public` | [`DiagnosticTarget`](../type-aliases/DiagnosticTarget.md) \| *typeof* [`NoTarget`](../variables/NoTarget.md) |
