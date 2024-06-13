---
jsApi: true
title: "[I] ReplaceTextCodeFixEdit"

---
## Extends

- [`TextRange`](TextRange.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `end` | `readonly` | `number` | The ending position measured in UTF-16 code units from the start of the full string. Exclusive. | [`TextRange`](TextRange.md).`end` |
| `file` | `readonly` | [`SourceFile`](SourceFile.md) | - | - |
| `kind` | `readonly` | `"replace-text"` | - | - |
| `pos` | `readonly` | `number` | The starting position of the ranger measured in UTF-16 code units from the start of the full string. Inclusive. | [`TextRange`](TextRange.md).`pos` |
| `text` | `readonly` | `string` | - | - |
