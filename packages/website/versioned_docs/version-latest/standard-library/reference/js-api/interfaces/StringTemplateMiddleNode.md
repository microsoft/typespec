---
jsApi: true
title: "[I] StringTemplateMiddleNode"

---
## Extends

- [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ | :------ |
| `directives?` | `readonly` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`directives` | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`directives` |
| `docs?` | `readonly` | readonly [`DocNode`](DocNode.md)[] | - | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`docs` | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`docs` |
| `end` | `readonly` | `number` | The ending position measured in UTF-16 code units from the start of the full string. Exclusive. | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`end` | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`end` |
| `flags` | `readonly` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`flags` | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`flags` |
| `kind` | `readonly` | `StringTemplateMiddle` | - | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`kind` | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`kind` |
| `parent?` | `readonly` | [`Node`](../type-aliases/Node.md) | - | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`parent` | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`parent` |
| `pos` | `readonly` | `number` | The starting position of the ranger measured in UTF-16 code units from the start of the full string. Inclusive. | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`pos` | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`pos` |
| `symbol` | `readonly` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice, you will likely only access symbol in cases where you know the node has a symbol. | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`symbol` | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`symbol` |
| `value` | `readonly` | `string` | - | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`value` | [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md).`value` |
