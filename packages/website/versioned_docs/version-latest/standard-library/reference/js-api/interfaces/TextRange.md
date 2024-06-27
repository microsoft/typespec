---
jsApi: true
title: "[I] TextRange"

---
## Extended by

- [`BaseNode`](BaseNode.md)
- [`LineComment`](LineComment.md)
- [`BlockComment`](BlockComment.md)
- [`SourceLocation`](SourceLocation.md)
- [`ReplaceTextCodeFixEdit`](ReplaceTextCodeFixEdit.md)

## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `end` | `readonly` | `number` | The ending position measured in UTF-16 code units from the start of the full string. Exclusive. |
| `pos` | `readonly` | `number` | The starting position of the ranger measured in UTF-16 code units from the start of the full string. Inclusive. |
