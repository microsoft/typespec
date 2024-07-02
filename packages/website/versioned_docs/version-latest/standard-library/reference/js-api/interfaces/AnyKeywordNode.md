---
jsApi: true
title: "[I] AnyKeywordNode"

---
## Extends

- [`BaseNode`](BaseNode.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ | :------ |
| `directives?` | `readonly` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`BaseNode`](BaseNode.md).`directives` | [`BaseNode`](BaseNode.md).`directives` |
| `docs?` | `readonly` | readonly [`DocNode`](DocNode.md)[] | - | [`BaseNode`](BaseNode.md).`docs` | [`BaseNode`](BaseNode.md).`docs` |
| `end` | `readonly` | `number` | The ending position measured in UTF-16 code units from the start of the full string. Exclusive. | [`BaseNode`](BaseNode.md).`end` | [`BaseNode`](BaseNode.md).`end` |
| `flags` | `readonly` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`BaseNode`](BaseNode.md).`flags` | [`BaseNode`](BaseNode.md).`flags` |
| `kind` | `readonly` | `UnknownKeyword` | - | [`BaseNode`](BaseNode.md).`kind` | [`BaseNode`](BaseNode.md).`kind` |
| `parent?` | `readonly` | [`Node`](../type-aliases/Node.md) | - | [`BaseNode`](BaseNode.md).`parent` | [`BaseNode`](BaseNode.md).`parent` |
| `pos` | `readonly` | `number` | The starting position of the ranger measured in UTF-16 code units from the start of the full string. Inclusive. | [`BaseNode`](BaseNode.md).`pos` | [`BaseNode`](BaseNode.md).`pos` |
| `symbol` | `readonly` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice, you will likely only access symbol in cases where you know the node has a symbol. | [`BaseNode`](BaseNode.md).`symbol` | [`BaseNode`](BaseNode.md).`symbol` |
