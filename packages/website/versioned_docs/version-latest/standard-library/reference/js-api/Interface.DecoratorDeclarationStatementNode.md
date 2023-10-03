---
jsApi: true
title: "[I] DecoratorDeclarationStatementNode"

---
Represent a decorator declaration

## Example

```typespec
extern dec doc(target: Type, value: valueof string);
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
| `readonly` `kind` | [`DecoratorDeclarationStatement`](Enumeration.SyntaxKind.md#decoratordeclarationstatement) | - |
| `readonly` `modifierFlags` | [`ModifierFlags`](Enumeration.ModifierFlags.md) | - |
| `readonly` `modifiers` | *readonly* [`ExternKeywordNode`](Interface.ExternKeywordNode.md)[] | - |
| `readonly` `parameters` | [`FunctionParameterNode`](Interface.FunctionParameterNode.md)[] | Additional parameters |
| `parent`? | [`TypeSpecScriptNode`](Interface.TypeSpecScriptNode.md) \| [`NamespaceStatementNode`](Interface.NamespaceStatementNode.md) | - |
| `readonly` `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. |
| `readonly` `symbol` | [`Sym`](Interface.Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. |
| `readonly` `target` | [`FunctionParameterNode`](Interface.FunctionParameterNode.md) | Decorator target. First parameter. |
