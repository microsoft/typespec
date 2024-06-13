---
jsApi: true
title: "[I] BlockComment"

---
## Extends

- [`TextRange`](TextRange.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `end` | `readonly` | `number` | The ending position measured in UTF-16 code units from the start of the full string. Exclusive. | [`TextRange`](TextRange.md).`end` |
| `kind` | `readonly` | `BlockComment` | - | - |
| `parsedAsDocs?` | `readonly` | `boolean` | If that comment was parsed as a doc comment. If parserOptions.docs=false this will always be false. | - |
| `pos` | `readonly` | `number` | The starting position of the ranger measured in UTF-16 code units from the start of the full string. Inclusive. | [`TextRange`](TextRange.md).`pos` |
