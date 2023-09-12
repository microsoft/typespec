---
jsApi: true
title: "[I] TextRange"

---
## Extended By

- [`BaseNode`](Interface.BaseNode.md)
- [`LineComment`](Interface.LineComment.md)
- [`BlockComment`](Interface.BlockComment.md)
- [`SourceLocation`](Interface.SourceLocation.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `readonly` `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. |
| `readonly` `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. |
