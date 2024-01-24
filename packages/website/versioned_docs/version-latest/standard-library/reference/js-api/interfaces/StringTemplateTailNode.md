---
jsApi: true
title: "[I] StringTemplateTailNode"

---
## Extends

- [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `readonly` | `directives?` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`StringTemplateLiteralLikeNode.directives`](StringTemplateLiteralLikeNode.md) |
| `readonly` | `docs?` | readonly [`DocNode`](DocNode.md)[] | - | [`StringTemplateLiteralLikeNode.docs`](StringTemplateLiteralLikeNode.md) |
| `readonly` | `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. | [`StringTemplateLiteralLikeNode.end`](StringTemplateLiteralLikeNode.md) |
| `readonly` | `flags` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`StringTemplateLiteralLikeNode.flags`](StringTemplateLiteralLikeNode.md) |
| `readonly` | `kind` | `StringTemplateTail` | - | [`StringTemplateLiteralLikeNode.kind`](StringTemplateLiteralLikeNode.md) |
| `readonly` | `parent?` | [`Node`](../type-aliases/Node.md) | - | [`StringTemplateLiteralLikeNode.parent`](StringTemplateLiteralLikeNode.md) |
| `readonly` | `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. | [`StringTemplateLiteralLikeNode.pos`](StringTemplateLiteralLikeNode.md) |
| `readonly` | `symbol` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. | [`StringTemplateLiteralLikeNode.symbol`](StringTemplateLiteralLikeNode.md) |
| `readonly` | `value` | `string` | - | [`StringTemplateLiteralLikeNode.value`](StringTemplateLiteralLikeNode.md) |
