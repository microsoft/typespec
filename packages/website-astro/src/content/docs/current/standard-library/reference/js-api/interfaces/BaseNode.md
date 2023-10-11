---
jsApi: true
title: "[I] BaseNode"

---
## Extends

- [`TextRange`](TextRange.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `readonly` | `directives?` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | - |
| `readonly` | `docs?` | readonly [`DocNode`](DocNode.md)[] | - | - |
| `readonly` | `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. | [`TextRange`](TextRange.md).`end` |
| `readonly` | `flags` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | - |
| `readonly` | `kind` | [`SyntaxKind`](../enumerations/SyntaxKind.md) | - | - |
| `readonly` | `parent?` | [`Node`](../type-aliases/Node.md) | - | - |
| `readonly` | `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. | [`TextRange`](TextRange.md).`pos` |
| `readonly` | `symbol` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. | - |
