---
jsApi: true
title: "[I] DiagnosticDefinition"

---
Declare a diagnostic that can be reported by the library.

## Example

```ts
unterminated: {
  severity: "error",
  description: "Unterminated token.",
  url: "https://example.com/docs/diags/unterminated",
  messages: {
    default: paramMessage`Unterminated ${"token"}.`,
  },
},
```

## Type Parameters

| Type Parameter |
| ------ |
| `M` *extends* [`DiagnosticMessages`](DiagnosticMessages.md) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| `description?` | `readonly` | `string` | Short description of the diagnostic |
| `messages` | `readonly` | `M` | Messages that can be reported with the diagnostic. |
| `severity` | `readonly` | `"error"` \| `"warning"` | Diagnostic severity. - `warning` - Suppressable, should be used to represent potential issues but not blocking. - `error` - Non-suppressable, should be used to represent failure to move forward. |
| `url?` | `readonly` | `string` | Specifies the URL at which the full documentation can be accessed. |
