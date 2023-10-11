---
jsApi: true
title: "[I] TextRange"

---
## Extended By

- [`BaseNode`](BaseNode.md)
- [`LineComment`](LineComment.md)
- [`BlockComment`](BlockComment.md)
- [`SourceLocation`](SourceLocation.md)

## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `readonly` | `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. |
| `readonly` | `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. |
