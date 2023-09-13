---
jsApi: true
title: "[I] BlockComment"

---
## Extends

- [`TextRange`](Interface.TextRange.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `readonly` `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. |
| `readonly` `kind` | [`BlockComment`](Enumeration.SyntaxKind.md#blockcomment) | - |
| `parsedAsDocs`? | `boolean` | If that comment was parsed as a doc comment. If parserOptions.docs=false this will always be false. |
| `readonly` `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. |
