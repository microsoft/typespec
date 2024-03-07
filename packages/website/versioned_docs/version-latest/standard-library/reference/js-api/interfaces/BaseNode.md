---
jsApi: true
title: "[I] BaseNode"

---
## Extends

- [`TextRange`](TextRange.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `directives?` | `readonly` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | - |
| `docs?` | `readonly` | readonly [`DocNode`](DocNode.md)[] | - | - |
| `end` | `readonly` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. | [`TextRange`](TextRange.md).`end` |
| `flags` | `readonly` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | - |
| `kind` | `readonly` | [`SyntaxKind`](../enumerations/SyntaxKind.md) | - | - |
| `parent?` | `readonly` | [`Node`](../type-aliases/Node.md) | - | - |
| `pos` | `readonly` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. | [`TextRange`](TextRange.md).`pos` |
| `symbol` | `readonly` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. | - |
