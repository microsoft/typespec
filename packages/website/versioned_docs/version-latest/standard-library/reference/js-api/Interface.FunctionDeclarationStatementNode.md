---
jsApi: true
title: "[I] FunctionDeclarationStatementNode"

---
Represent a function declaration

## Example

```typespec
extern fn camelCase(value: StringLiteral): StringLiteral;
```

## Extends

- [`BaseNode`](Interface.BaseNode.md).[`DeclarationNode`](Interface.DeclarationNode.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `directives`? | *readonly* [`DirectiveExpressionNode`](Interface.DirectiveExpressionNode.md)[] | - |
| `docs`? | *readonly* [`DocNode`](Interface.DocNode.md)[] | - |
| `readonly` `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. |
| `readonly` `flags` | [`NodeFlags`](Enumeration.NodeFlags.md) | - |
| `readonly` `id` | [`IdentifierNode`](Interface.IdentifierNode.md) | - |
| `readonly` `kind` | [`FunctionDeclarationStatement`](Enumeration.SyntaxKind.md#functiondeclarationstatement) | - |
| `readonly` `modifierFlags` | [`ModifierFlags`](Enumeration.ModifierFlags.md) | - |
| `readonly` `modifiers` | *readonly* [`ExternKeywordNode`](Interface.ExternKeywordNode.md)[] | - |
| `readonly` `parameters` | [`FunctionParameterNode`](Interface.FunctionParameterNode.md)[] | - |
| `parent`? | [`TypeSpecScriptNode`](Interface.TypeSpecScriptNode.md) \| [`NamespaceStatementNode`](Interface.NamespaceStatementNode.md) | - |
| `readonly` `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. |
| `returnType`? | [`Expression`](Type.Expression.md) | - |
| `readonly` `symbol` | [`Sym`](Interface.Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. |
