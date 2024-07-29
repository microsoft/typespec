---
jsApi: true
title: "[I] AliasStatementNode"

---
## Extends

- [`BaseNode`](BaseNode.md).[`DeclarationNode`](DeclarationNode.md).[`TemplateDeclarationNode`](TemplateDeclarationNode.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| ------ | ------ | ------ | ------ | ------ | ------ |
| `directives?` | `readonly` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | - | [`BaseNode`](BaseNode.md).`directives` |
| `docs?` | `readonly` | readonly [`DocNode`](DocNode.md)[] | - | - | [`BaseNode`](BaseNode.md).`docs` |
| `end` | `readonly` | `number` | The ending position measured in UTF-16 code units from the start of the full string. Exclusive. | - | [`BaseNode`](BaseNode.md).`end` |
| `flags` | `readonly` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | - | [`BaseNode`](BaseNode.md).`flags` |
| `id` | `readonly` | [`IdentifierNode`](IdentifierNode.md) | - | - | [`DeclarationNode`](DeclarationNode.md).`id` |
| `kind` | `readonly` | `AliasStatement` | - | [`BaseNode`](BaseNode.md).`kind` | - |
| `locals?` | `readonly` | `SymbolTable` | - | - | [`TemplateDeclarationNode`](TemplateDeclarationNode.md).`locals` |
| `parent?` | `readonly` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) \| [`NamespaceStatementNode`](NamespaceStatementNode.md) | - | [`BaseNode`](BaseNode.md).`parent` | - |
| `pos` | `readonly` | `number` | The starting position of the ranger measured in UTF-16 code units from the start of the full string. Inclusive. | - | [`BaseNode`](BaseNode.md).`pos` |
| `symbol` | `readonly` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice, you will likely only access symbol in cases where you know the node has a symbol. | - | [`BaseNode`](BaseNode.md).`symbol` |
| `templateParameters` | `readonly` | readonly [`TemplateParameterDeclarationNode`](TemplateParameterDeclarationNode.md)[] | - | - | [`TemplateDeclarationNode`](TemplateDeclarationNode.md).`templateParameters` |
| `templateParametersRange` | `readonly` | [`TextRange`](TextRange.md) | - | - | [`TemplateDeclarationNode`](TemplateDeclarationNode.md).`templateParametersRange` |
| `value` | `readonly` | [`Expression`](../type-aliases/Expression.md) | - | - | - |
