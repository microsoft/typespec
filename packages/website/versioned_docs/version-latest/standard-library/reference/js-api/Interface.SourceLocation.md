---
jsApi: true
title: "[I] SourceLocation"

---
## Extends

- [`TextRange`](Interface.TextRange.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `readonly` `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. |
| `file` | [`SourceFile`](Interface.SourceFile.md) | - |
| `isSynthetic`? | `boolean` | - |
| `readonly` `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. |
