---
jsApi: true
title: "[I] StringTemplateMiddleNode"

---
## Extends

- [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `readonly` | `directives`? | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`directives` |
| `readonly` | `docs`? | readonly [`DocNode`](DocNode.md)[] | - | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`docs` |
| `readonly` | `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`end` |
| `readonly` | `flags` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`flags` |
| `readonly` | `kind` | `StringTemplateMiddle` | - | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`kind` |
| `readonly` | `parent`? | [`Node`](../type-aliases/Node.md) | - | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`parent` |
| `readonly` | `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`pos` |
| `readonly` | `symbol` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`symbol` |
| `readonly` | `value` | `string` | - | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`value` |
