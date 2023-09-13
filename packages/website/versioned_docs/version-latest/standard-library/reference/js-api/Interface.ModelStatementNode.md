---
jsApi: true
title: "[I] ModelStatementNode"

---
## Extends

- [`BaseNode`](Interface.BaseNode.md).[`DeclarationNode`](Interface.DeclarationNode.md).[`TemplateDeclarationNode`](Interface.TemplateDeclarationNode.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `readonly` `decorators` | *readonly* [`DecoratorExpressionNode`](Interface.DecoratorExpressionNode.md)[] | - |
| `directives`? | *readonly* [`DirectiveExpressionNode`](Interface.DirectiveExpressionNode.md)[] | - |
| `docs`? | *readonly* [`DocNode`](Interface.DocNode.md)[] | - |
| `readonly` `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. |
| `extends`? | [`Expression`](Type.Expression.md) | - |
| `readonly` `flags` | [`NodeFlags`](Enumeration.NodeFlags.md) | - |
| `readonly` `id` | [`IdentifierNode`](Interface.IdentifierNode.md) | - |
| `is`? | [`Expression`](Type.Expression.md) | - |
| `readonly` `kind` | [`ModelStatement`](Enumeration.SyntaxKind.md#modelstatement) | - |
| `locals`? | `SymbolTable` | - |
| `parent`? | [`TypeSpecScriptNode`](Interface.TypeSpecScriptNode.md) \| [`NamespaceStatementNode`](Interface.NamespaceStatementNode.md) | - |
| `readonly` `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. |
| `readonly` `properties` | *readonly* ([`ModelPropertyNode`](Interface.ModelPropertyNode.md) \| [`ModelSpreadPropertyNode`](Interface.ModelSpreadPropertyNode.md))[] | - |
| `readonly` `symbol` | [`Sym`](Interface.Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. |
| `readonly` `templateParameters` | *readonly* [`TemplateParameterDeclarationNode`](Interface.TemplateParameterDeclarationNode.md)[] | - |
