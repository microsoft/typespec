---
jsApi: true
title: "[I] BlockComment"

---
## Extends

- [`TextRange`](TextRange.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `readonly` | `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. | [`TextRange`](TextRange.md).`end` |
| `readonly` | `kind` | `BlockComment` | - | - |
| `readonly` | `parsedAsDocs?` | `boolean` | If that comment was parsed as a doc comment. If parserOptions.docs=false this will always be false. | - |
| `readonly` | `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. | [`TextRange`](TextRange.md).`pos` |
