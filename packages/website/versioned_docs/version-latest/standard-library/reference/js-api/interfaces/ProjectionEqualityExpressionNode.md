---
jsApi: true
title: "[I] ProjectionEqualityExpressionNode"

---
## Extends

- [`BaseNode`](BaseNode.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `readonly` | `directives?` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`BaseNode.directives`](BaseNode.md) |
| `readonly` | `docs?` | readonly [`DocNode`](DocNode.md)[] | - | [`BaseNode.docs`](BaseNode.md) |
| `readonly` | `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. | [`BaseNode.end`](BaseNode.md) |
| `readonly` | `flags` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`BaseNode.flags`](BaseNode.md) |
| `readonly` | `kind` | `ProjectionEqualityExpression` | - | [`BaseNode.kind`](BaseNode.md) |
| `readonly` | `left` | [`ProjectionExpression`](../type-aliases/ProjectionExpression.md) | - | - |
| `readonly` | `op` | `"=="` \| `"!="` | - | - |
| `readonly` | `parent?` | [`Node`](../type-aliases/Node.md) | - | [`BaseNode.parent`](BaseNode.md) |
| `readonly` | `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. | [`BaseNode.pos`](BaseNode.md) |
| `readonly` | `right` | [`ProjectionExpression`](../type-aliases/ProjectionExpression.md) | - | - |
| `readonly` | `symbol` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. | [`BaseNode.symbol`](BaseNode.md) |
