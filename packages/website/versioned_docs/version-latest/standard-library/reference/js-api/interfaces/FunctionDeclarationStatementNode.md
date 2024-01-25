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

- [`BaseNode`](BaseNode.md).[`DeclarationNode`](DeclarationNode.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `readonly` | `directives?` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`BaseNode.directives`](BaseNode.md) |
| `readonly` | `docs?` | readonly [`DocNode`](DocNode.md)[] | - | [`BaseNode.docs`](BaseNode.md) |
| `readonly` | `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. | [`BaseNode.end`](BaseNode.md) |
| `readonly` | `flags` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`BaseNode.flags`](BaseNode.md) |
| `readonly` | `id` | [`IdentifierNode`](IdentifierNode.md) | - | [`DeclarationNode.id`](DeclarationNode.md) |
| `readonly` | `kind` | `FunctionDeclarationStatement` | - | [`BaseNode.kind`](BaseNode.md) |
| `readonly` | `modifierFlags` | [`ModifierFlags`](../enumerations/ModifierFlags.md) | - | - |
| `readonly` | `modifiers` | readonly [`ExternKeywordNode`](ExternKeywordNode.md)[] | - | - |
| `readonly` | `parameters` | [`FunctionParameterNode`](FunctionParameterNode.md)[] | - | - |
| `readonly` | `parent?` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) \| [`NamespaceStatementNode`](NamespaceStatementNode.md) | - | [`BaseNode.parent`](BaseNode.md) |
| `readonly` | `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. | [`BaseNode.pos`](BaseNode.md) |
| `readonly` | `returnType?` | [`Expression`](../type-aliases/Expression.md) | - | - |
| `readonly` | `symbol` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. | [`BaseNode.symbol`](BaseNode.md) |
