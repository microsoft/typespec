---
jsApi: true
title: "[I] DocReturnsTagNode"

---
## Extends

- [`DocTagBaseNode`](DocTagBaseNode.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `readonly` | `content` | readonly [`DocTextNode`](DocTextNode.md)[] | - | [`DocTagBaseNode.content`](DocTagBaseNode.md) |
| `readonly` | `directives?` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`DocTagBaseNode.directives`](DocTagBaseNode.md) |
| `readonly` | `docs?` | readonly [`DocNode`](DocNode.md)[] | - | [`DocTagBaseNode.docs`](DocTagBaseNode.md) |
| `readonly` | `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. | [`DocTagBaseNode.end`](DocTagBaseNode.md) |
| `readonly` | `flags` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`DocTagBaseNode.flags`](DocTagBaseNode.md) |
| `readonly` | `kind` | `DocReturnsTag` | - | [`DocTagBaseNode.kind`](DocTagBaseNode.md) |
| `readonly` | `parent?` | [`Node`](../type-aliases/Node.md) | - | [`DocTagBaseNode.parent`](DocTagBaseNode.md) |
| `readonly` | `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. | [`DocTagBaseNode.pos`](DocTagBaseNode.md) |
| `readonly` | `symbol` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. | [`DocTagBaseNode.symbol`](DocTagBaseNode.md) |
| `readonly` | `tagName` | [`IdentifierNode`](IdentifierNode.md) | - | [`DocTagBaseNode.tagName`](DocTagBaseNode.md) |
