---
jsApi: true
title: "[I] ModelStatementNode"

---
## Extends

- [`BaseNode`](BaseNode.md).[`DeclarationNode`](DeclarationNode.md).[`TemplateDeclarationNode`](TemplateDeclarationNode.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ | :------ |
| `bodyRange` | `readonly` | [`TextRange`](TextRange.md) | - | - | - |
| `decorators` | `readonly` | readonly [`DecoratorExpressionNode`](DecoratorExpressionNode.md)[] | - | - | - |
| `directives?` | `readonly` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`BaseNode`](BaseNode.md).`directives` | [`BaseNode`](BaseNode.md).`directives` |
| `docs?` | `readonly` | readonly [`DocNode`](DocNode.md)[] | - | [`BaseNode`](BaseNode.md).`docs` | [`BaseNode`](BaseNode.md).`docs` |
| `end` | `readonly` | `number` | The ending position measured in UTF-16 code units from the start of the full string. Exclusive. | [`BaseNode`](BaseNode.md).`end` | [`BaseNode`](BaseNode.md).`end` |
| `extends?` | `readonly` | [`Expression`](../type-aliases/Expression.md) | - | - | - |
| `flags` | `readonly` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`BaseNode`](BaseNode.md).`flags` | [`BaseNode`](BaseNode.md).`flags` |
| `id` | `readonly` | [`IdentifierNode`](IdentifierNode.md) | - | [`DeclarationNode`](DeclarationNode.md).`id` | [`DeclarationNode`](DeclarationNode.md).`id` |
| `is?` | `readonly` | [`Expression`](../type-aliases/Expression.md) | - | - | - |
| `kind` | `readonly` | `ModelStatement` | - | [`BaseNode`](BaseNode.md).`kind` | [`BaseNode`](BaseNode.md).`kind` |
| `locals?` | `readonly` | `SymbolTable` | - | [`TemplateDeclarationNode`](TemplateDeclarationNode.md).`locals` | [`TemplateDeclarationNode`](TemplateDeclarationNode.md).`locals` |
| `parent?` | `readonly` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) \| [`NamespaceStatementNode`](NamespaceStatementNode.md) | - | [`BaseNode`](BaseNode.md).`parent` | [`BaseNode`](BaseNode.md).`parent` |
| `pos` | `readonly` | `number` | The starting position of the ranger measured in UTF-16 code units from the start of the full string. Inclusive. | [`BaseNode`](BaseNode.md).`pos` | [`BaseNode`](BaseNode.md).`pos` |
| `properties` | `readonly` | readonly ([`ModelPropertyNode`](ModelPropertyNode.md) \| [`ModelSpreadPropertyNode`](ModelSpreadPropertyNode.md))[] | - | - | - |
| `symbol` | `readonly` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice, you will likely only access symbol in cases where you know the node has a symbol. | [`BaseNode`](BaseNode.md).`symbol` | [`BaseNode`](BaseNode.md).`symbol` |
| `templateParameters` | `readonly` | readonly [`TemplateParameterDeclarationNode`](TemplateParameterDeclarationNode.md)[] | - | [`TemplateDeclarationNode`](TemplateDeclarationNode.md).`templateParameters` | [`TemplateDeclarationNode`](TemplateDeclarationNode.md).`templateParameters` |
| `templateParametersRange` | `readonly` | [`TextRange`](TextRange.md) | - | [`TemplateDeclarationNode`](TemplateDeclarationNode.md).`templateParametersRange` | [`TemplateDeclarationNode`](TemplateDeclarationNode.md).`templateParametersRange` |
