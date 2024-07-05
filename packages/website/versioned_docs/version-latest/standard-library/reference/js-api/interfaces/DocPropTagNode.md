---
jsApi: true
title: "[I] DocPropTagNode"

---
## Extends

- [`DocTagBaseNode`](DocTagBaseNode.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ | :------ |
| `content` | `readonly` | readonly [`DocTextNode`](DocTextNode.md)[] | - | [`DocTagBaseNode`](DocTagBaseNode.md).`content` | [`DocTagBaseNode`](DocTagBaseNode.md).`content` |
| `directives?` | `readonly` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`DocTagBaseNode`](DocTagBaseNode.md).`directives` | [`DocTagBaseNode`](DocTagBaseNode.md).`directives` |
| `docs?` | `readonly` | readonly [`DocNode`](DocNode.md)[] | - | [`DocTagBaseNode`](DocTagBaseNode.md).`docs` | [`DocTagBaseNode`](DocTagBaseNode.md).`docs` |
| `end` | `readonly` | `number` | The ending position measured in UTF-16 code units from the start of the full string. Exclusive. | [`DocTagBaseNode`](DocTagBaseNode.md).`end` | [`DocTagBaseNode`](DocTagBaseNode.md).`end` |
| `flags` | `readonly` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`DocTagBaseNode`](DocTagBaseNode.md).`flags` | [`DocTagBaseNode`](DocTagBaseNode.md).`flags` |
| `kind` | `readonly` | `DocPropTag` | - | [`DocTagBaseNode`](DocTagBaseNode.md).`kind` | [`DocTagBaseNode`](DocTagBaseNode.md).`kind` |
| `parent?` | `readonly` | [`Node`](../type-aliases/Node.md) | - | [`DocTagBaseNode`](DocTagBaseNode.md).`parent` | [`DocTagBaseNode`](DocTagBaseNode.md).`parent` |
| `pos` | `readonly` | `number` | The starting position of the ranger measured in UTF-16 code units from the start of the full string. Inclusive. | [`DocTagBaseNode`](DocTagBaseNode.md).`pos` | [`DocTagBaseNode`](DocTagBaseNode.md).`pos` |
| `propName` | `readonly` | [`IdentifierNode`](IdentifierNode.md) | - | - | - |
| `symbol` | `readonly` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice, you will likely only access symbol in cases where you know the node has a symbol. | [`DocTagBaseNode`](DocTagBaseNode.md).`symbol` | [`DocTagBaseNode`](DocTagBaseNode.md).`symbol` |
| `tagName` | `readonly` | [`IdentifierNode`](IdentifierNode.md) | - | [`DocTagBaseNode`](DocTagBaseNode.md).`tagName` | [`DocTagBaseNode`](DocTagBaseNode.md).`tagName` |
