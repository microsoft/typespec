---
jsApi: true
title: "[I] UnionStatementNode"

---
## Extends

- [`BaseNode`](BaseNode.md).[`DeclarationNode`](DeclarationNode.md).[`TemplateDeclarationNode`](TemplateDeclarationNode.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `readonly` | `decorators` | readonly [`DecoratorExpressionNode`](DecoratorExpressionNode.md)[] | - | - |
| `readonly` | `directives?` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`BaseNode`](BaseNode.md).`directives` |
| `readonly` | `docs?` | readonly [`DocNode`](DocNode.md)[] | - | [`BaseNode`](BaseNode.md).`docs` |
| `readonly` | `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. | [`BaseNode`](BaseNode.md).`end` |
| `readonly` | `flags` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`BaseNode`](BaseNode.md).`flags` |
| `readonly` | `id` | [`IdentifierNode`](IdentifierNode.md) | - | [`DeclarationNode`](DeclarationNode.md).`id` |
| `readonly` | `kind` | `UnionStatement` | - | [`BaseNode`](BaseNode.md).`kind` |
| `readonly` | `locals?` | `SymbolTable` | - | [`TemplateDeclarationNode`](TemplateDeclarationNode.md).`locals` |
| `readonly` | `options` | readonly [`UnionVariantNode`](UnionVariantNode.md)[] | - | - |
| `readonly` | `parent?` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) \| [`NamespaceStatementNode`](NamespaceStatementNode.md) | - | [`BaseNode`](BaseNode.md).`parent` |
| `readonly` | `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. | [`BaseNode`](BaseNode.md).`pos` |
| `readonly` | `symbol` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. | [`BaseNode`](BaseNode.md).`symbol` |
| `readonly` | `templateParameters` | readonly [`TemplateParameterDeclarationNode`](TemplateParameterDeclarationNode.md)[] | - | [`TemplateDeclarationNode`](TemplateDeclarationNode.md).`templateParameters` |
