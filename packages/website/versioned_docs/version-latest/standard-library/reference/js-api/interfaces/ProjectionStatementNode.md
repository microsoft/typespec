---
jsApi: true
title: "[I] ProjectionStatementNode"

---
## Extends

- [`BaseNode`](BaseNode.md).[`DeclarationNode`](DeclarationNode.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ | :------ |
| `directives?` | `readonly` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`BaseNode`](BaseNode.md).`directives` | [`BaseNode`](BaseNode.md).`directives` |
| `docs?` | `readonly` | readonly [`DocNode`](DocNode.md)[] | - | [`BaseNode`](BaseNode.md).`docs` | [`BaseNode`](BaseNode.md).`docs` |
| `end` | `readonly` | `number` | The ending position measured in UTF-16 code units from the start of the full string. Exclusive. | [`BaseNode`](BaseNode.md).`end` | [`BaseNode`](BaseNode.md).`end` |
| `flags` | `readonly` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`BaseNode`](BaseNode.md).`flags` | [`BaseNode`](BaseNode.md).`flags` |
| `from?` | `readonly` | [`ProjectionNode`](ProjectionNode.md) | - | - | - |
| `id` | `readonly` | [`IdentifierNode`](IdentifierNode.md) | - | [`DeclarationNode`](DeclarationNode.md).`id` | [`DeclarationNode`](DeclarationNode.md).`id` |
| `kind` | `readonly` | `ProjectionStatement` | - | [`BaseNode`](BaseNode.md).`kind` | [`BaseNode`](BaseNode.md).`kind` |
| `parent?` | `readonly` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) \| [`NamespaceStatementNode`](NamespaceStatementNode.md) | - | [`BaseNode`](BaseNode.md).`parent` | [`BaseNode`](BaseNode.md).`parent` |
| `pos` | `readonly` | `number` | The starting position of the ranger measured in UTF-16 code units from the start of the full string. Inclusive. | [`BaseNode`](BaseNode.md).`pos` | [`BaseNode`](BaseNode.md).`pos` |
| `preFrom?` | `readonly` | [`ProjectionNode`](ProjectionNode.md) | - | - | - |
| `preTo?` | `readonly` | [`ProjectionNode`](ProjectionNode.md) | - | - | - |
| `projections` | `readonly` | readonly [`ProjectionNode`](ProjectionNode.md)[] | - | - | - |
| `selector` | `readonly` |  \| [`MemberExpressionNode`](MemberExpressionNode.md) \| [`IdentifierNode`](IdentifierNode.md) \| [`ProjectionModelSelectorNode`](ProjectionModelSelectorNode.md) \| [`ProjectionModelPropertySelectorNode`](ProjectionModelPropertySelectorNode.md) \| [`ProjectionScalarSelectorNode`](ProjectionScalarSelectorNode.md) \| [`ProjectionInterfaceSelectorNode`](ProjectionInterfaceSelectorNode.md) \| [`ProjectionOperationSelectorNode`](ProjectionOperationSelectorNode.md) \| [`ProjectionEnumSelectorNode`](ProjectionEnumSelectorNode.md) \| [`ProjectionEnumMemberSelectorNode`](ProjectionEnumMemberSelectorNode.md) \| [`ProjectionUnionSelectorNode`](ProjectionUnionSelectorNode.md) \| [`ProjectionUnionVariantSelectorNode`](ProjectionUnionVariantSelectorNode.md) | - | - | - |
| `symbol` | `readonly` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice, you will likely only access symbol in cases where you know the node has a symbol. | [`BaseNode`](BaseNode.md).`symbol` | [`BaseNode`](BaseNode.md).`symbol` |
| `to?` | `readonly` | [`ProjectionNode`](ProjectionNode.md) | - | - | - |
