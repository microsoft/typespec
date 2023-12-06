---
jsApi: true
title: "[I] StringTemplateSpanNode"

---
## Extends

- [`BaseNode`](BaseNode.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `readonly` | `directives`? | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`BaseNode`](BaseNode.md).`directives` |
| `readonly` | `docs`? | readonly [`DocNode`](DocNode.md)[] | - | [`BaseNode`](BaseNode.md).`docs` |
| `readonly` | `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. | [`BaseNode`](BaseNode.md).`end` |
| `readonly` | `expression` | [`Expression`](../type-aliases/Expression.md) | - | - |
| `readonly` | `flags` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`BaseNode`](BaseNode.md).`flags` |
| `readonly` | `kind` | `StringTemplateSpan` | - | [`BaseNode`](BaseNode.md).`kind` |
| `readonly` | `literal` | [`StringTemplateMiddleNode`](StringTemplateMiddleNode.md) \| [`StringTemplateTailNode`](StringTemplateTailNode.md) | - | - |
| `readonly` | `parent`? | [`Node`](../type-aliases/Node.md) | - | [`BaseNode`](BaseNode.md).`parent` |
| `readonly` | `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. | [`BaseNode`](BaseNode.md).`pos` |
| `readonly` | `symbol` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. | [`BaseNode`](BaseNode.md).`symbol` |
