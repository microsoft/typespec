---
jsApi: true
title: "[I] DocTemplateTagNode"

---
## Extends

- [`DocTagBaseNode`](DocTagBaseNode.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `readonly` | `content` | readonly [`DocTextNode`](DocTextNode.md)[] | - | [`DocTagBaseNode`](DocTagBaseNode.md).`content` |
| `readonly` | `directives?` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`DocTagBaseNode`](DocTagBaseNode.md).`directives` |
| `readonly` | `docs?` | readonly [`DocNode`](DocNode.md)[] | - | [`DocTagBaseNode`](DocTagBaseNode.md).`docs` |
| `readonly` | `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. | [`DocTagBaseNode`](DocTagBaseNode.md).`end` |
| `readonly` | `flags` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`DocTagBaseNode`](DocTagBaseNode.md).`flags` |
| `readonly` | `kind` | `DocTemplateTag` | - | [`DocTagBaseNode`](DocTagBaseNode.md).`kind` |
| `readonly` | `paramName` | [`IdentifierNode`](IdentifierNode.md) | - | - |
| `readonly` | `parent?` | [`Node`](../type-aliases/Node.md) | - | [`DocTagBaseNode`](DocTagBaseNode.md).`parent` |
| `readonly` | `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. | [`DocTagBaseNode`](DocTagBaseNode.md).`pos` |
| `readonly` | `symbol` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. | [`DocTagBaseNode`](DocTagBaseNode.md).`symbol` |
| `readonly` | `tagName` | [`IdentifierNode`](IdentifierNode.md) | - | [`DocTagBaseNode`](DocTagBaseNode.md).`tagName` |
